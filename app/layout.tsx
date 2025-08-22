import type React from "react";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tic Tac Toe || Diorsolutions",
  description: "Created with Genius",
  generator: "DiorSolutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head></head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
