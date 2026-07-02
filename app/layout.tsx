import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xin Ning - Personal Website",
  description: "Full Stack Developer & Creative Technologist",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
