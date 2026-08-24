import { connectToDatabase } from '@/lib/db';
import { AppSettings } from '@/models/settings';
import { DEFAULT_APP_NAME, DEFAULT_LOGO_URL, type PublicBranding } from '@/lib/branding-constants';

export type { PublicBranding };
export { DEFAULT_APP_NAME, DEFAULT_LOGO_URL };

export async function getPublicBranding(): Promise<PublicBranding> {
  try {
    await connectToDatabase();
    const settings = await AppSettings.findOne({ key: 'app' }).select('appName logoContentType updatedAt').lean();
    if (!settings) {
      return { appName: DEFAULT_APP_NAME, logoUrl: DEFAULT_LOGO_URL, hasCustomLogo: false };
    }

    const hasCustomLogo = Boolean(settings.logoContentType);
    const version = settings.updatedAt ? new Date(settings.updatedAt).getTime() : Date.now();

    return {
      appName: settings.appName || DEFAULT_APP_NAME,
      logoUrl: hasCustomLogo ? `/api/branding/logo?v=${version}` : DEFAULT_LOGO_URL,
      hasCustomLogo,
    };
  } catch {
    return { appName: DEFAULT_APP_NAME, logoUrl: DEFAULT_LOGO_URL, hasCustomLogo: false };
  }
}
