import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import ToastProvider from "@/components/ui/Toast";
import MetaPixelTracker from "@/components/MetaPixelTracker";

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
        <Script
          id="meta-pixel"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1546210030517507');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1" width="1" style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1546210030517507&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {children}
        <ToastProvider />
        <MetaPixelTracker />
      </body>
    </html>
  );
}
