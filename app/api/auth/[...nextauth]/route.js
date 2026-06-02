import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import { prisma } from "../../../lib/prisma";

export const authOptions = {
  session: {
    strategy: "jwt",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("User not found");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Invalid password");
        }

        if (!user.isVerified) {
          throw new Error("Please verify your email first");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.type,
          role: user.role,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.type = user.type;
        token.role = user.role;
      }

      if (account?.provider === "google") {
        const dbUser = await prisma.user.upsert({
          where: { email: token.email },
          update: { name: token.name },
          create: {
            email: token.email,
            name: token.name,
            isVerified: true,
            password: "",
            type: "user",
            role: "user",
          },
        });

        token.id = dbUser.id;
        token.type = dbUser.type;
        token.role = dbUser.role;
      }

      return token;
    },                             // ✅ fixed: comma was missing here

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.type = token.type;
        session.user.role = token.role;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };