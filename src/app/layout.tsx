import type { Metadata } from 'next';
import './globals.css';
import { BanaSetuProvider } from '../context/BanaSetuContext';
import MaitriyamLauncher from '@/components/maitriyam/MaitriyamLauncher';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://samagna.gov.in'),
  title: 'Samagna · ସମଗ୍ନ — From the Forest to the Marketplace',
  description: 'Verified minor forest produce procurement, transparent custodial tracking, and institutional B2B trade connecting tribal gatherers across Odisha directly to enterprise buyers.',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Samagna · ସମଗ୍ନ — Value-Chain Platform for Minor Forest Produce',
    description: 'Procurement, custody tracking, and enterprise B2B trade under TDCCOL statutory protections.',
    url: 'https://samagna.gov.in',
    siteName: 'Samagna Platform',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/demo/banasetu-demo-poster.jpg',
        width: 1280,
        height: 720,
        alt: 'Samagna · ସମଗ୍ନ Forest-to-Market Platform Overview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Samagna · ସମଗ୍ନ — Value-Chain Platform for Minor Forest Produce',
    description: 'Verified minor forest produce procurement, transparent custodial tracking, and institutional B2B trade.',
    images: ['/demo/banasetu-demo-poster.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-bg text-ink antialiased">
      <body className="min-h-screen bg-bg text-ink font-sans selection:bg-cream selection:text-forest">
        <BanaSetuProvider>
          {children}
          <MaitriyamLauncher />
        </BanaSetuProvider>
      </body>
    </html>
  );
}
