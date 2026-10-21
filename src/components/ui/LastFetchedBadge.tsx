'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { RefreshCw } from 'lucide-react';

export interface LastFetchedBadgeProps {
  timestamp: Date;
  onRefresh?: () => void;
  className?: string;
}

export const LastFetchedBadge: React.FC<LastFetchedBadgeProps> = ({
  timestamp,
  onRefresh,
  className,
}) => {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const updateAge = () => {
      const diffSec = Math.floor((Date.now() - timestamp.getTime()) / 1000);
      setSecondsAgo(diffSec);
    };

    updateAge();
    const interval = setInterval(updateAge, 5000);
    return () => clearInterval(interval);
  }, [timestamp]);

  const isStale = secondsAgo >= 60;

  const timeString = timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-mono text-ink-subtle select-none',
        className
      )}
    >
      <span>
        Fetched {timeString} ({secondsAgo}s ago)
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
