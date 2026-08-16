import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Noto_Sans_Thai, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '../components/Providers';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const thai = Noto_Sans_Thai({
  subsets: ['thai'],
  variable: '--font-thai',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EcoBin Connect | PCRU',
  description: 'เว็บแอปพลิเคชันคัดแยกขยะขวดพลาสติก มหาวิทยาลัยราชภัฏเพชรบูรณ์',
  icons: {
    icon: '/ecobin-logo.png',
    apple: '/ecobin-logo.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" className={`${jakarta.variable} ${thai.variable}`}>
      <body className="antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
