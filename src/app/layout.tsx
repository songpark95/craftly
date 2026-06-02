import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "craftly",
  description: "A cozy crafting companion — track projects, stash, and stitches",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,600;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans pb-20 md:pb-0">{children}</body>
    </html>
  );
}
