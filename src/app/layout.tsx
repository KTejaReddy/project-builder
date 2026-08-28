import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProjectProvider } from "@/context/ProjectContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProjectForge AI - Build Any Project. Learn Every Step.",
  description: "The world's best AI software engineering mentor. Build production-ready web applications, mobile apps, and systems step-by-step with guided code lessons, interactive roadmaps, and code diagnostics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ProjectProvider>
          {children}
        </ProjectProvider>
      </body>
    </html>
  );
}

