'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { RefreshCw } from 'lucide-react';

export interface LastFetchedBadgeProps {
  timestamp: Date;
  onRefresh?: () => void;
  className?: string;
  placeholder?: string;
}

/**
 * Deterministic timestamp formatter avoiding platform/ICU variations
 * between Node.js SSR and client browser engines.
 * Formats consistently as 'hh:mm:ss AM/PM' with standard ASCII spacing and uppercase AM/PM.
 */
export function formatTimeSafe(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return '--:--:--';
  }
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = (hours % 12 || 12).toString().padStart(2, '0');
  return `${displayHours}:${minutes}:${seconds} ${ampm}`;
}

export const LastFetchedBadge: React.FC<LastFetchedBadgeProps> = ({
  timestamp,
  onRefresh,
  className,
  placeholder = '--:--:--',
}) => {
  const [mounted, setMounted] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    setMounted(true);

    const updateAge = () => {
      if (!timestamp || isNaN(timestamp.getTime())) {
        setSecondsAgo(0);
        return;
      }
      const diffSec = Math.max(0, Math.floor((Date.now() - timestamp.getTime()) / 1000));
      setSecondsAgo(diffSec);
    };

    updateAge();
    const interval = setInterval(updateAge, 5000);
    return () => clearInterval(interval);
  }, [timestamp]);

  const isStale = mounted && secondsAgo >= 60;
  const timeString = formatTimeSafe(timestamp);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-mono text-ink-subtle select-none',
        className
      )}
    >
      <span>
        Fetched {mounted ? `${timeString} (${secondsAgo}s ago)` : placeholder}
      </span>
      {isStale && onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="text-accent font-semibold underline hover:opacity-90 ml-1 inline-flex items-center gap-1 focus:outline-2 focus:outline-accent focus:outline-offset-0"
        >
          <RefreshCw size={11} strokeWidth={1.5} />
          <span>Stale · refresh</span>
        </button>
      )}
    </div>
  );
};

