import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tea-rate",
  description: "A personal tea journal and catalog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
