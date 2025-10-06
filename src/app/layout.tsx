import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "マーケティングナレッジチャットボット",
  description: "マーケティング学習コンテンツを検索できるAIチャットボット",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
