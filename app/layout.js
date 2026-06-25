import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./context/ThemeContext";
import Providers from "./provider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* ✅ Bing Webmaster Verification */}
        <meta name="msvalidate.01" content="YOUR_BING_VERIFICATION_CODE" />

        {/* ✅ Yandex Webmaster Verification */}
        <meta name="yandex-verification" content="YOUR_YANDEX_VERIFICATION_CODE" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}