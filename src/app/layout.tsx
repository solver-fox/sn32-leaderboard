import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'SN32 Tracker',
  description: 'Bittensor SN32 miner analytics dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface text-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
