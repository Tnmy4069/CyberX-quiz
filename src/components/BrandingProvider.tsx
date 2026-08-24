'use client';

import React, { createContext, useContext } from 'react';
import { DEFAULT_APP_NAME, DEFAULT_LOGO_URL, type PublicBranding } from '@/lib/branding-constants';

const BrandingContext = createContext<PublicBranding>({
  appName: DEFAULT_APP_NAME,
  logoUrl: DEFAULT_LOGO_URL,
  hasCustomLogo: false,
});

export function BrandingProvider({
  branding,
  children,
}: {
  branding: PublicBranding;
  children: React.ReactNode;
}) {
  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}
