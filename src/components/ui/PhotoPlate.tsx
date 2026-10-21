import * as React from 'react';
import { cn } from '../../lib/utils';
import { Camera } from 'lucide-react';

export interface PhotoPlateProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  caption?: string;
  metadata?: string;
  src?: string;
  aspectRatio?: '4/3' | '16/9' | '1/1';
}

export const PhotoPlate: React.FC<PhotoPlateProps> = ({
  label,
  caption,
  metadata,
  src,
  aspectRatio = '4/3',
  className,
  ...props
}) => {
  return (
    <figure
      className={cn(
        'group flex flex-col border border-rule bg-surface rounded-none overflow-hidden shadow-none',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'relative w-full border-b border-rule bg-bg-sunken flex items-center justify-center overflow-hidden',
          aspectRatio === '4/3' && 'aspect-[4/3]',
          aspectRatio === '16/9' && 'aspect-[16/9]',
          aspectRatio === '1/1' && 'aspect-square'
        )}
      >
        {src ? (
          <img src={src} alt={caption || label} loading="lazy" className="h-full w-full object-cover rounded-none" />
        ) : (
          <>
            {/* Architectural diagonal hatch pattern: crisp 1px lines, no gradients */}
            <svg
              className="absolute inset-0 h-full w-full"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <pattern
                  id={`hatch-pattern-${label.replace(/\s+/g, '-').toLowerCase()}`}
                  width="10"
                  height="10"
                  patternTransform="rotate(45 0 0)"
                  patternUnits="userSpaceOnUse"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="10"
                    stroke="var(--rule)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill={`url(#hatch-pattern-${label.replace(/\s+/g, '-').toLowerCase()})`}
              />
            </svg>

            {/* Label stamp overlay */}
            <div className="relative z-10 mx-4 max-w-[85%] border border-rule bg-surface/95 px-3 py-2 text-center rounded-none shadow-none">
              <div className="flex items-center justify-center gap-1.5 text-ink-muted mb-0.5">
                <Camera size={16} strokeWidth={1.5} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em]">
                  Evidence Seal
                </span>
              </div>
              <p className="text-[12px] font-medium text-ink leading-snug">{label}</p>
              {metadata && (
                <p className="text-[10px] tabular-nums text-ink-subtle mt-0.5 font-mono">{metadata}</p>
              )}
            </div>
          </>
        )}
      </div>

      {caption && (
        <figcaption className="p-2.5 text-[12px] text-ink-muted bg-surface border-t border-transparent leading-snug">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};
