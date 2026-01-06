import "@/lib/orpc/server";
import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { AllProviders } from "@/providers";
import NextTopLoader from "nextjs-toploader";

export const metadata: Metadata = {
  title: "GAIA - The RAG Framework",
  description:
    "Build Intelligent AI Agents with a unified framework powered by LLMs, Local models, AI Tools, MCPS and  Vectorstores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="font-sans antialiased  h-screen"
        suppressHydrationWarning
      >
        <NextTopLoader color="#3EA56D" />
        <AllProviders>{children}</AllProviders>
      </body>
    </html>
  );
}
