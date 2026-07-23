import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
        {/* ✅ Bing + Yandex — ENV se aayega, Git mein visible nahi hoga */}
        <meta name="msvalidate.01" content="C969DC98F5B4EA442FF6FF3A941F9C1A" />
        <meta name="yandex-verification" content="2ba291fe8912edc4" />

        {/*
          ✅ Google Analytics (gtag.js) — har page par load hoga, kyunki ye root layout hai.
          strategy="lazyOnload": browser ke idle hone ka wait karta hai, taake GTM ka
          162 KiB bundle initial render / LCP / TBT ko block na kare. Analytics ke liye
          kuch second ki delay acceptable hai, user-facing content ke liye nahi.
        */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-CEG962163M"
          strategy="lazyOnload"
        />
        <Script id="ga-gtag-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CEG962163M');
          `}
        </Script>
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