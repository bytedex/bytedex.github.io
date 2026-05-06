import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { config } from '@/lib/config';
import './globals.css';

const sans = Space_Grotesk({
  subsets: ['latin'],
  variable: '--sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${config.name} — ${config.role}`,
  description: config.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
