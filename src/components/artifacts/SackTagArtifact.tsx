'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { cn } from '../../lib/utils';
import { ProductIcon } from '../ui/ProductIcons';

export interface SackTagData {
  code: string;
  productName: string;
  collectorFirstName: string;
  village: string;
  dateStr: string;
  netWeightKg: number;
  helplinePhone?: string;
}

interface SackTagArtifactProps {
  data: SackTagData;
  className?: string;
  id?: string;
}

export const SackTagArtifact: React.FC<SackTagArtifactProps> = ({
  data,
  className,
  id,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    async function makeQR() {
      try {
        const url = await QRCode.toDataURL(
          `BANASETU-TAG-${data.code}-TDCCOL-${data.netWeightKg}KG`,
          {
            width: 80,
            margin: 1,
            color: {
              dark: '#1F1A14',
              light: '#FFFFFF',
            },
          }
        );
        setQrUrl(url);
      } catch (err) {
        console.error('QR code generation failed:', err);
      }
    }
    makeQR();
  }, [data.code, data.netWeightKg]);

  return (
    <article
      id={id}
      aria-label={`Official Sack Tag ${data.code}`}
      className={cn(
        'a6-tag-card w-full max-w-[105mm] min-h-[148mm] border border-rule bg-surface p-5 text-ink flex flex-col justify-between shadow-none select-none relative',
        className
      )}
    >
      <div className="space-y-4">
        {/* Top Row: Short Code in Fraunces 32px tabular top-left + QR top-right (deterministic, small) */}
        <header className="flex items-start justify-between gap-3 border-b border-rule pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-ink-muted block font-bold">
              Produce Lot Tag
            </span>
            {/* Fraunces 32px tabular top-left */}
            <div className="font-heading text-[32px] font-bold tabular-nums text-ink leading-tight">
              {data.code}
            </div>
          </div>

          {/* QR top-right (deterministic, small) */}
          <div className="w-[80px] h-[80px] border border-rule bg-surface p-1 shrink-0 flex items-center justify-center">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt={`QR Tag for ${data.code}`}
                loading="lazy"
                className="w-full h-full object-contain [image-rendering:pixelated]"
              />
            ) : (
              <div className="w-full h-full bg-bg-sunken flex items-center justify-center text-[9px] font-mono text-ink-muted">
                QR Tag
              </div>
            )}
          </div>
        </header>

        {/* Product, Collector name (first name + village only — no full identity), Date, Net Weight */}
        <section aria-label="Batch specifications" className="space-y-3 text-[13px] leading-snug">
          <div className="border-b border-rule pb-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-ink-muted block font-bold">
                Product
              </span>
              <div className="font-semibold text-ink text-[16px]">
                {data.productName}
              </div>
            </div>
            <div className="w-10 h-10 rounded-[3px] overflow-hidden border border-rule/60 bg-bg-sunken flex-shrink-0 shadow-sm">
              <ProductIcon product={data.productName} size={40} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="border-b border-rule pb-2">
            <span className="text-[10px] font-mono uppercase text-ink-muted block font-bold">
              Collector & Village (First Name Only)
            </span>
            <div className="font-medium text-ink">
              {data.collectorFirstName} · {data.village}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-b border-rule pb-2">
            <div>
              <span className="text-[10px] font-mono uppercase text-ink-muted block font-bold">
                Date
              </span>
              <div className="font-mono text-[12px] text-ink">
                {data.dateStr}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-ink-muted block font-bold">
                Net Weight
              </span>
              <div className="font-heading text-[22px] font-bold tabular-nums text-ink leading-tight">
                {data.netWeightKg.toFixed(1)} <span className="text-[13px] font-sans font-normal text-ink-muted">kg</span>
              </div>
            </div>
          </div>

          {/* A 14px line: "If found, call 1800-XXX-XXXX (placeholder)." */}
          <div className="pt-1">
            <p className="text-[14px] text-ink font-mono font-medium">
              If found, call 1800-XXX-XXXX (placeholder).
            </p>
          </div>
        </section>
      </div>

      {/* Nothing else. No logos on the front. Small "BanaSetu · prototype" at the bottom. */}
      <footer className="border-t border-rule pt-2 mt-auto flex items-center justify-between text-[11px] font-mono text-ink-subtle select-none">
        <span>BanaSetu · prototype</span>
        <span className="text-[9px]">A6 SACK TAG</span>
      </footer>
    </article>
  );
};
