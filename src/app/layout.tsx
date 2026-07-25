import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LeadDesk Mini — Capture & Manage Project Leads",
  description:
    "A production-grade lead-capture platform. Submit your project brief and let our team track it from inquiry to close.",
  openGraph: {
    title: "LeadDesk Mini",
    description: "Capture, store, and manage inbound project leads in one place.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
