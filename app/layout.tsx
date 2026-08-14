import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "KYO-SU | 共通テスト数学分析",
  description: "共通テスト数学の演習結果を、解いた順番で分析する個人用ダッシュボード。",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

