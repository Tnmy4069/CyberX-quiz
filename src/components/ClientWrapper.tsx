'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { BrandingProvider } from '@/components/BrandingProvider';
import type { PublicBranding } from '@/lib/branding-constants';
import { DEFAULT_APP_NAME, DEFAULT_LOGO_URL } from '@/lib/branding-constants';

export function ClientWrapper({
  children,
  branding,
}: {
  children: React.ReactNode;
  branding?: PublicBranding;
}) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <BrandingProvider
          branding={
            branding ?? {
              appName: DEFAULT_APP_NAME,
              logoUrl: DEFAULT_LOGO_URL,
              hasCustomLogo: false,
            }
          }
        >
          {children}
        </BrandingProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
