import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Website Builder — Build Faster",
  description: "Create fully functional, SEO-optimized websites in seconds with our advanced AI engine.",
};

export default function AIBuilderLayout({ children }: { children: React.ReactNode }) {
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
