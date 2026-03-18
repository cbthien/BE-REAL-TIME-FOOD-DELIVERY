'use client';

import { LandingHeader } from '@/components/layout/LandingHeader';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}