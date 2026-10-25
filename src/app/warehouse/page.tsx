'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WarehouseRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/inventory');
  }, [router]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-ink">
      <p className="text-[13px] font-mono text-ink-muted">Redirecting to Warehouse Depot workspace...</p>
    </div>
  );
}
