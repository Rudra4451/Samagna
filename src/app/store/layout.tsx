import React from 'react';

export const metadata = {
  title: 'Samagna Forest Store | Pure Wild Forest Produce',
  description: 'Pure, traceably gathered forest produce from the Similipal Biosphere Reserve. Ethical wild harvest with 100% fair-trade gatherer compensation guaranteed.',
};

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 antialiased font-sans selection:bg-[#2D5A27] selection:text-white">
      {children}
    </div>
  );
}

