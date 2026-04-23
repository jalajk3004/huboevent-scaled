import type { Metadata } from "next";
import { Inter, Outfit, Geist, Pacifico, Fredoka } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Script from 'next/script'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const pacifico = Pacifico({
  weight: "400",
  variable: "--font-pacifico",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HubO Events | Where Moments Become Experiences",
  description: "We create unforgettable concerts, nightlife experiences, and brand events that bring people together.",
  icons: {
    icon: [
      { url: "/hubologo.png", type: "image/png" },
    ],
    shortcut: { url: "/hubologo.png", type: "image/png" },
    apple: { url: "/hubologo.png", type: "image/png" },
  },
  openGraph: {
    title: "HubO Events",
    description: "Where Moments Become Experiences",
    images: ["/hubologo.png"],
  },
};

export const viewport = {
  width: 'device-width',
  height: 'device-height',
  initialScale: 1.0,
  maximumScale: 1.0,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className={`${inter.variable} ${outfit.variable} ${pacifico.variable} ${fredoka.variable} ${inter.className}`}>

        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '809662601689814');
            fbq('track', 'PageView');
          `}
        </Script>
        {/* End Meta Pixel Code */}

        {/* Google tag (gtag.js) */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-BG6HYYSJ02"></Script>
        <Script id="google-analytics">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-BG6HYYSJ02');`}
        </Script>
        {/* End Google tag (gtag.js) */}
        {children}
      </body>
    </html>
  );
}