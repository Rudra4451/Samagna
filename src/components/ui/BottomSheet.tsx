'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const BottomSheet = DialogPrimitive.Root;
export const BottomSheetTrigger = DialogPrimitive.Trigger;
export const BottomSheetClose = DialogPrimitive.Close;
export const BottomSheetPortal = DialogPrimitive.Portal;

export const BottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-ink/40 transition-opacity',
      className
    )}
    {...props}
  />
));
BottomSheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <BottomSheetPortal>
    <BottomSheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      onOpenAutoFocus={(e) => {
        const titleEl = document.querySelector('[data-sheet-title]') as HTMLElement;
        if (titleEl) {
          e.preventDefault();
          titleEl.focus();
        }
      }}
      className={cn(
        'fixed bottom-0 inset-x-0 z-50 flex max-h-[90vh] w-full max-w-[480px] mx-auto flex-col',
        'bg-surface border-t border-rule shadow-none outline-none',
        'transition-transform duration-[180ms] ease-out',
        className
      )}
      {...props}
    >
      {/* Visual drag handle bar */}
      <div className="w-full flex items-center justify-center pt-2.5 pb-1">
        <div className="w-10 h-1 rounded-[2px] bg-rule" />
      </div>
      {children}
    </DialogPrimitive.Content>
  </BottomSheetPortal>
));
BottomSheetContent.displayName = DialogPrimitive.Content.displayName;

export const BottomSheetHeader = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex items-center justify-between border-b border-rule px-4 py-3 shrink-0',
      className
    )}
    {...props}
  >
    <div className="flex flex-col space-y-0.5">{children}</div>
    <DialogPrimitive.Close className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-[4px] border border-transparent text-ink-muted hover:border-rule hover:bg-bg-sunken hover:text-ink focus:outline-2 focus:outline-accent focus:outline-offset-0">
      <X size={18} strokeWidth={1.5} />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  </div>
);
BottomSheetHeader.displayName = 'BottomSheetHeader';

export const BottomSheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    data-sheet-title
    tabIndex={-1}
    className={cn('font-heading text-[18px] font-semibold text-ink leading-tight outline-none', className)}
    {...props}
  />
));
BottomSheetTitle.displayName = DialogPrimitive.Title.displayName;

export const BottomSheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-[13px] text-ink-muted', className)}
    {...props}
  />
));
BottomSheetDescription.displayName = DialogPrimitive.Description.displayName;

export const BottomSheetBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex-1 overflow-y-auto p-4 space-y-4', className)} {...props} />
);
BottomSheetBody.displayName = 'BottomSheetBody';

export const BottomSheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col gap-2 border-t border-rule p-4 bg-bg-sunken/40 shrink-0',
      className
    )}
    {...props}
  />
);
BottomSheetFooter.displayName = 'BottomSheetFooter';
