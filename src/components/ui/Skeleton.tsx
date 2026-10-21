import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  style,
  ...props
}) => {
  return (
    <div
      role="status"
      aria-label="Loading content"
      className={cn(
        'border border-rule bg-bg-sunken rounded-[2px] shadow-none select-none',
        // Strict specification: no shimmer, no animation, 1px-bordered grey block
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
};
