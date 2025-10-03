import type { Metadata } from "next";
import { Geist_Mono, Inter, Poppins } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SOC App",
    template: "%s | SOC App",
  },
  description:
    "A luxurious, modern SOC management platform with real-time oversight and analytics.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
