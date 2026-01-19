import "@/lib/orpc/server";
import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { AllProviders } from "@/providers";
import NextTopLoader from "nextjs-toploader";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "GAIA - The RAG Framework",
  description:
    "Build Intelligent AI Agents with a unified framework powered by LLMs, Local models, AI Tools, MCPS and  Vectorstores.",
};
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn("font-sans antialiased  h-screen", inter.className)}
        suppressHydrationWarning
      >
        <NextTopLoader color="#3EA56D" />
        <AllProviders>{children}</AllProviders>
      </body>
    </html>
  );
}
