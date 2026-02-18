import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Before the Storm — For Ananda",
  description:
    "This space is only built when you are strong, so it can protect you when you are not.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable}`}>
        <div className="global-brand">
          <span className="global-brand-icon">☁</span>
          Before the Storm <em>for Ananda</em>
        </div>
        {children}
        <footer className="global-footer">
          Made with love, crafted exclusively for Ananda — by Julian ♡
        </footer>
      </body>
    </html>
  );
}
