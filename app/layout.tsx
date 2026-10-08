import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Roomies — Live together. Split smarter.",
  description: "Rent, bills, chores and shared expenses for people who live together.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Roomies", statusBarStyle: "default" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4338ca" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0d1a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeScript = `try{var t=localStorage.getItem('roomies.theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
