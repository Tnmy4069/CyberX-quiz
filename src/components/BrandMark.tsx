'use client';

import Link from 'next/link';
import { useBranding } from '@/components/BrandingProvider';

type Size = 'sm' | 'md' | 'lg';

const sizeClass: Record<Size, string> = {
  sm: 'h-9 sm:h-11 max-w-[140px] sm:max-w-[180px]',
  md: 'h-12 sm:h-20 max-w-[160px] sm:max-w-[220px]',
  lg: 'h-14 sm:h-28 max-w-[180px] sm:max-w-[260px]',
};

export function BrandMark({
  href = '/',
  size = 'md',
  showName = false,
}: {
  href?: string | null;
  size?: Size;
  showName?: boolean;
}) {
  const { appName, logoUrl } = useBranding();

  const mark = (
    <span className="flex items-center gap-2 min-w-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} alt={appName} className={`${sizeClass[size]} w-auto object-contain`} />
      {showName && (
        <span className="truncate font-bold text-sm sm:text-base text-foreground">{appName}</span>
      )}
    </span>
  );

  if (!href) return mark;
  return (
    <Link href={href} className="flex items-center gap-2 min-w-0 shrink">
      {mark}
    </Link>
  );
}

export function SiteFooter() {
  const { appName } = useBranding();
  return (
    <footer className="py-6 border-t border-border text-center text-xs text-muted-foreground px-4">
      &copy; {new Date().getFullYear()} {appName}. All rights reserved.
    </footer>
  );
}
