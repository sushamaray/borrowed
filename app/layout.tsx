import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "./ToastProvider";

export const metadata: Metadata = {
  title: "Borrowed",
  description: "Borrowed item management and account access.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
