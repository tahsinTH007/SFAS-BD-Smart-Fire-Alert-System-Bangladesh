import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/navbar";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SFAS-BD | Smart Fire Alert System – Bangladesh",
  description:
    "Station control console for OGNIBORMO multi-sensor fire detection units.",
  applicationName: "SFAS-BD",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The console is used on phones in the field; let operators zoom.
  maximumScale: 5,
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-950 text-slate-100 antialiased`}
      >
        <Providers>
          <Navbar />
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            expand
            toastOptions={{
              classNames: {
                toast:
                  "!bg-slate-900 !border-slate-700 !text-slate-100 !text-sm",
                description: "!text-slate-400",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
