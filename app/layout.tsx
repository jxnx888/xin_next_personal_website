import type { Metadata } from "next";
import "./globals.css";
import "highlight.js/styles/atom-one-dark.css";

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
