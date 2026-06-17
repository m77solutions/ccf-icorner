import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iCorner — CCF Welcome Center",
  description: "Discipleship Journey Calendar of Events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
