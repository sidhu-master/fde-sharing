// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0

import type { Metadata } from "next";
import { Barlow, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

// Barlow for the brand and labels; Spline Sans Mono with tabular figures for numbers.
const barlow = Barlow({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

const splineSansMono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ACME Mobile Merchant",
  description: "The ACME Mobile back office, an example for the merchant agent.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${splineSansMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
