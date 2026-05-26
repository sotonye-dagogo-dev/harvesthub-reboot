import { NextResponse } from 'next/server';

import { cisConfig } from '@/lib/config/cis';

export async function GET() {
    return NextResponse.json({
        success: true,
        data: {
            appName: cisConfig.appName,
            appUrl: cisConfig.appUrl,
            platformSlug: cisConfig.platformSlug,
            ready: cisConfig.ready,
            apiUrl: cisConfig.apiUrl,
            webhookPath: cisConfig.webhookPath,
            webhookConfigured: Boolean(cisConfig.webhookSecret),
        },
    });
}