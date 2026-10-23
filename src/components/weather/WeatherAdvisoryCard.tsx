'use client';

import React from 'react';
import { Sun, Droplets, Wind, Thermometer, AlertCircle } from 'lucide-react';

export interface WeatherAdvisoryCardProps {
  district?: string;
  className?: string;
}

export const WeatherAdvisoryCard: React.FC<WeatherAdvisoryCardProps> = ({
  district = 'Mayurbhanj (Karanjia / Similipal Foothills)',
  className = '',
}) => {
  return (
    <div className={`border border-rule rounded-[4px] bg-surface p-4 text-ink space-y-3 ${className}`}>
      <div className="flex items-center justify-between border-b border-rule pb-2.5">
        <div className="flex items-center gap-1.5 text-accent text-[11px] font-mono uppercase font-semibold">
          <Sun size={15} /> Forest Produce Drying Advisory · ପାଣିପାଗ ସୂଚନା
        </div>
        <span className="text-[10px] font-mono text-ink-subtle">
          Simulated Field Weather
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="border border-rule rounded-[3px] p-2 bg-bg-sunken">
          <span className="text-[10px] uppercase font-mono text-ink-muted block flex items-center justify-center gap-1">
            <Thermometer size={12} /> Ambient Temp
          </span>
          <div className="font-heading text-[18px] font-bold tabular-nums text-ink mt-0.5">
            36.5°C
          </div>
          <span className="text-[10px] text-ink-subtle font-mono">Dry Heat</span>
        </div>

        <div className="border border-rule rounded-[3px] p-2 bg-bg-sunken">
          <span className="text-[10px] uppercase font-mono text-ink-muted block flex items-center justify-center gap-1">
            <Droplets size={12} /> Humidity
          </span>
          <div className="font-heading text-[18px] font-bold tabular-nums text-success mt-0.5">
            32% RH
          </div>
          <span className="text-[10px] text-ink-subtle font-mono">Low Moisture</span>
        </div>

        <div className="border border-rule rounded-[3px] p-2 bg-bg-sunken">
          <span className="text-[10px] uppercase font-mono text-ink-muted block flex items-center justify-center gap-1">
            <Wind size={12} /> Drying Index
          </span>
          <div className="font-heading text-[16px] font-bold text-success mt-1">
            OPTIMAL
          </div>
          <span className="text-[10px] text-ink-subtle font-mono">Grade A Drying</span>
        </div>
      </div>

      <div className="text-[12px] text-ink-muted flex items-start gap-2 bg-bg-sunken/60 p-2.5 rounded-[3px] border border-rule/60">
        <AlertCircle size={15} className="text-accent shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-ink font-semibold">Transit Desiccation Advisory:</strong> Low ambient humidity across Similipal plateau facilitates accelerated moisture evaporation. Estimated allowable natural transit shrinkage for open road transit is <span className="text-ink font-mono font-semibold">1.2% – 1.5%</span>. All loads must maintain tarpaulin canopy covers.
        </p>
      </div>
    </div>
  );
};
