import "@/config/env";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { ProgressBarProvider } from "./components/TopLoadingBar";
import { UserProvider } from "./components/providers/UserProvider";
import { QueryProvider } from "./components/providers/QueryProvider";
import { ToastProvider } from "@/components/ui/ToastQueue";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Script from "next/script";
import SvgSprite from "@/components/icons/SvgSprite";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "StellarFlow Network Dashboard",
  description:
    "Monitor relayers, contracts, logs, and network health in real time.",
  manifest: "/manifest.json",
  themeColor: "#39ff14",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StellarFlow",
  },
  icons: {
    apple: "/icon-192.svg",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode; }>) {
  const { HelpModal } = useShortcuts({});
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent background flash before next-themes hydrates */}
        <style nonce={nonce}>{`html { background-color: #0d1117; }`}</style>
        {/* Preconnect to polyfill CDN (font files are self-hosted via next/font, so no Google Fonts preconnect needed) */}
        <link
          rel="preconnect"
          href="https://polyfill-library.fastly.dev"
        />
        <link
          rel="preconnect"
          href="https://raw.githubusercontent.com"
        />
        <link
          rel="preconnect"
          href="https://assets.coingecko.com"
        />
        <link
          rel="preload"
          href="/sf.webp"
          as="image"
          type="image/webp"
          fetchPriority="high"
        />
        <link
          rel="preload"
          href="/sprite.svg"
          as="image"
          type="image/svg+xml"
          fetchPriority="low"
        />
        {/* PWA: apple-touch-icon for iOS home-screen bookmarks */}
        <link
          rel="apple-touch-icon"
          href="/icon-192.svg"
          sizes="192x192"
        />
        <Script
          id="polyfill-loader"
          nonce={nonce}
          strategy="afterInteractive"
          fetchPriority="low"
          dangerouslySetInnerHTML={{
            __html: `
              if (!('IntersectionObserver' in window) || 
                  !('ResizeObserver' in window) || 
                  !('fetch' in window) || 
                  !('Promise' in window)) {
                console.info('StellarFlow: Modern features missing. Loading on-demand polyfills...');
                var js = document.createElement('script');
                js.src = 'https://polyfill-library.fastly.dev/v3/polyfill.min.js?features=default,IntersectionObserver,ResizeObserver,fetch,Promise';
                document.head.appendChild(js);
              }
            `
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} antialiased font-sans flex flex-col min-h-screen`}
      >
        <SvgSprite />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <UserProvider>
            <QueryProvider>
              <ProgressBarProvider>
                <ToastProvider>
                  <ErrorBoundary tags={{ section: "root" }}>
                    {children}
                  </ErrorBoundary>
                </ToastProvider>
                <InstallBanner />
              </ProgressBarProvider>
            </QueryProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
