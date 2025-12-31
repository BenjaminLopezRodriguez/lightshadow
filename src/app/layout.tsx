import "@/styles/globals.css";
import "highlight.js/styles/github-dark.css";

import { type Metadata } from "next";
import { Inter } from "next/font/google";
import { Playfair_Display } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "@/app/_components/theme-provider";

export const metadata: Metadata = {
  title: "LightShadow - AI Diffusion Models for Enterprise",
  description: "Cutting-edge diffusion models optimized for enterprise applications",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
