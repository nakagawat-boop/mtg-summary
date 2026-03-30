import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "営業 MTG サマリー", description: "SC + CS 週次営業サマリー" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ja"><body>{children}</body></html>;
}
