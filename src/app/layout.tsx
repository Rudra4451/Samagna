import type { Metadata } from 'next';
import './globals.css';
import { BanaSetuProvider } from '../context/BanaSetuContext';

export const metadata: Metadata = {
  title: 'Samagna · ସମଗ୍ନ — Forest, People, Prosperity',
  description: 'Transparent. Traceable. Together. Minor Forest Produce (MFP) procurement and custody ledger for tribal primary collectors in Odisha.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-bg text-ink antialiased">
      <body className="min-h-screen bg-bg text-ink font-body selection:bg-bg-sunken selection:text-ink">
        <BanaSetuProvider>
          {children}
        </BanaSetuProvider>
      </body>
    </html>
  );
}
