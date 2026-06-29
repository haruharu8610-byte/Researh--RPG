import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research RPG",
  description: "研究タスクをRPGで可視化",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-950 text-white min-h-screen">{children}</body>
    </html>
  );
}
