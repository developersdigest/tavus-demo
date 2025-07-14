import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tavus AI Chatbot",
  description: "AI-powered chatbot with Tavus integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}