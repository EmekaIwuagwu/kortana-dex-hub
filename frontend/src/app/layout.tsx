import React from "react";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "KortanaDEX | Premier Algorithmic Exchange",
  description: "Swap, Mint, and Farm on the flagship decentralized exchange of the Kortana Network. Optimized for 100% EVM compatibility and deep liquidity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-[#060810] text-[#f0f6fc] font-sans antialiased overflow-x-hidden selection:bg-cyan-500/30">
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#8b5cf6]/20 blur-[150px] rounded-full mix-blend-screen animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#00d4ff]/10 blur-[150px] rounded-full mix-blend-screen animate-pulse" />
          <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[#00d4ff]/5 blur-[200px] rounded-full mix-blend-screen" />
        </div>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 flex flex-col pt-24 pb-12 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster richColors theme="dark" position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
