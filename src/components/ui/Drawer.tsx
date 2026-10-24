'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export const DrawerPortal = DialogPrimitive.Portal;

export const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-ink/40',
      className
    )}
    {...props}
  />
));
DrawerOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DialogPrimitive.Content
      ref={ref}
      aria-live="polite"
      onOpenAutoFocus={(e) => {
        const titleEl = document.querySelector('[data-drawer-title]') as HTMLElement;
        if (titleEl) {
          e.preventDefault();
          titleEl.focus();
        }
      }}
      className={cn(
        'fixed inset-y-0 right-0 z-50 flex h-full w-[480px] max-w-full flex-col bg-surface border-l border-rule shadow-none outline-none motion-drawer-slide',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = DialogPrimitive.Content.displayName;

export const DrawerHeader = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex items-center justify-between border-b border-rule px-5 py-4 shrink-0',
      className
    )}
    {...props}
  >
    <div className="flex flex-col space-y-1">{children}</div>
    <DialogPrimitive.Close className="h-8 w-8 inline-flex items-center justify-center rounded-[4px] border border-transparent text-ink-muted hover:border-rule hover:bg-bg-sunken hover:text-ink focus:outline-2 focus:outline-accent focus:outline-offset-0">
      <X size={16} strokeWidth={1.5} />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  </div>
);
DrawerHeader.displayName = 'DrawerHeader';

export const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    data-drawer-title
    tabIndex={-1}
    className={cn('font-heading text-[18px] font-semibold text-ink leading-tight outline-none', className)}
    {...props}
  />
));
DrawerTitle.displayName = DialogPrimitive.Title.displayName;

export const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-[13px] text-ink-muted', className)}
    {...props}
  />
));
DrawerDescription.displayName = DialogPrimitive.Description.displayName;

export const DrawerBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex-1 overflow-y-auto p-5 space-y-4', className)} {...props} />
);
DrawerBody.displayName = 'DrawerBody';

export const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex items-center justify-end gap-3 border-t border-rule px-5 py-3.5 bg-bg-sunken/40 shrink-0', className)}
    {...props}
  />
);
DrawerFooter.displayName = 'DrawerFooter';
