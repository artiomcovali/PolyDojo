import Providers from '@/components/providers';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PolyDojo — Trade Polymarket Live. Zero Risk.',
  description:
    'Trade live Polymarket BTC markets with $DOJO on Base. Real odds. Real data. No real money on the line.',
  icons: {
    icon: '/APPICON.png',
    apple: '/APPICON.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0a0a]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
