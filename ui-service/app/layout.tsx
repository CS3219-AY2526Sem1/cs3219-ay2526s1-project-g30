import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LayoutContent } from "./LayoutContent";

import { AppShell } from "./AppShell";
import { validateConfigAtRuntime } from "@/lib/config";

// Validate environment variables at runtime (not build time)
validateConfigAtRuntime();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "G30 PeerPrep",
  description: "PeerPrep",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppShell>
          <LayoutContent>{children}</LayoutContent>
        </AppShell>
      </body>
    </html>
  );
}
