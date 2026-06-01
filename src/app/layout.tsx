import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Build Faster — AI Website Builder",
  description: "Create fully functional, SEO-optimized websites in seconds with our advanced AI engine.",
  icons: { icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230052FF'/%3E%3Ctext x='32' y='47' font-family='system-ui,sans-serif' font-size='40' font-weight='700' fill='white' text-anchor='middle'%3EB%3C/text%3E%3C/svg%3E" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full bg-black antialiased">{children}</body>
    </html>
  );
}
