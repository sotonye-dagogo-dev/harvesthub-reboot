import { NextResponse } from 'next/server';
import { OPTION_LIST_KEYS } from '@/lib/config/optionLists';
import { getOptionList } from '@/lib/services/optionLists';
import { apiError, withApiHandler } from '@/lib/api/http';

/**
 * GET /api/config/option-lists
 * Public read of every registered option list (merged DB-over-fallback).
 * Never throws — a DB outage returns the code fallbacks.
 */
export async function GET() {
  return withApiHandler('GET /api/config/option-lists', async () => {
    const entries = await Promise.all(
      OPTION_LIST_KEYS.map(async (key) => {
        const list = await getOptionList(key);
        return [key, list] as const;
      }),
    );

    const lists = entries.reduce<Record<string, unknown>>((acc, [key, list]) => {
      if (list) acc[key] = list;
      return acc;
    }, {});

    return NextResponse.json({ success: true, lists });
  });
}

export async function POST() {
  return apiError('Method not allowed', 405);
}
