import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Momen Store - Premium Online Shopping in Pakistan",
    template: "%s | Momen Store",
  },
  description:
    "Shop premium electronics, gaming, beauty products and more at Momen Store. Fast delivery across Pakistan. Cash on Delivery available.",
  keywords: [
    "Momen Store",
    "online shopping Pakistan",
    "electronics",
    "gaming",
    "beauty products",
    "COD Pakistan",
    "Easypaisa",
  ],
  openGraph: {
    title: "Momen Store - Premium Online Shopping",
    description:
      "Shop premium products at Momen Store. Fast delivery across Pakistan.",
    siteName: "Momen Store",
    type: "website",
    locale: "en_PK",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-primary text-white">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
