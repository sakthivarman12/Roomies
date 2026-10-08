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
    { color: "#090a16" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeScript = `try{var t=JSON.parse(localStorage.getItem('roomies.theme2')||'{}');var m=t.mode||'dark';if(m==='system')m=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var d=document.documentElement;d.setAttribute('data-theme',m);d.setAttribute('data-accent',t.accent||'indigo');d.setAttribute('data-glass',t.glass||'medium');d.setAttribute('data-motion',t.motion||'full');d.setAttribute('data-icons',t.iconStyle||'regular')}catch(e){document.documentElement.setAttribute('data-theme','dark')}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
