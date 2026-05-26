import { env } from '@/lib/config/env';

export type CrossPlatformCheckResult = {
  exists: boolean;
  canonicalUser: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  platforms: string[];
};

const PLATFORM_LABELS: Record<string, string> = {
  'myharvesthub': 'MyHarvestHub',
  'report-sys': 'Reporting System',
  'faith-hub': 'Faith Hub',
  'dmhicc': 'DMHicc',
  'church-crm': 'Church CRM',
};

export function formatPlatformName(platformId: string): string {
  return PLATFORM_LABELS[platformId] ?? platformId;
}

export async function checkEmailCrossPlatform(email: string): Promise<CrossPlatformCheckResult | null> {
  if (!env.cisApiUrl) {
    return null;
  }

  try {
    const url = `${env.cisApiUrl.replace(/\/+$/, '')}/api/v1/users/check-email/${encodeURIComponent(email)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      if (res.status === 404) {
        return { exists: false, canonicalUser: null, platforms: [] };
      }
      return null;
    }

    const body = await res.json();
    return body.data as CrossPlatformCheckResult;
  } catch {
    return null;
  }
}
