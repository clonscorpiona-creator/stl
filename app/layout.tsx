/*
 * 🏗️ STL Platform - Root Layout
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-18
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Layout from "./components/Layout";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "СТЛ",
  description: "Сообщество творческих людей",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${montserrat.variable} app-body`}>
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  );
}
