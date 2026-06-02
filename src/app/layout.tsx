import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Basewallet — Onchain Intelligence",
  description: "Analyze wallets, discover smart money, and track on-chain reputation on Base.",
  icons: { icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230052FF'/%3E%3Ctext x='32' y='47' font-family='system-ui,sans-serif' font-size='40' font-weight='700' fill='white' text-anchor='middle'%3EB%3C/text%3E%3C/svg%3E" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-black text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
