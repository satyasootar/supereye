import { Poppins, Merriweather, Fira_Code } from "next/font/google"
import type { Metadata, Viewport } from "next"

import "./globals.css"
import { Providers } from "@/app/providers"
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { rootMetadata } from "@/lib/site/metadata";
import { getSiteUrl } from "@/lib/site/config";

export const metadata: Metadata = rootMetadata;

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f17' },
  ],
  width: 'device-width',
  initialScale: 1,
};

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-serif",
});

const firaCode = Fira_Code({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", firaCode.variable, merriweather.variable, poppins.variable)}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('color-theme')||'default';document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`,
          }}
        />
        <link rel="alternate" type="text/plain" href={`${getSiteUrl()}/llms.txt`} title="LLM site summary" />
      </head>
      <body suppressHydrationWarning className="relative min-h-screen">
        <Providers>{children}</Providers>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
