import { NextRequest, NextResponse } from 'next/server';
import { getOptionList } from '@/lib/services/optionLists';
import { visibleOptions } from '@/lib/config/optionLists';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

interface RouteContext {
  params: Promise<{ key: string }>;
}

/**
 * GET /api/config/option-lists/[key]
 * Public read of a single option list.
 *
 * Unregistered keys answer 404 with the OPTION_LIST_NOT_FOUND envelope so a
 * stale client can tell "typo / removed key" apart from "temporarily empty".
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  return withApiHandler('GET /api/config/option-lists/[key]', async () => {
    const { key } = await context.params;
    const list = await getOptionList(key);

    if (!list) {
      return apiError('Option list not found', 404, { code: 'OPTION_LIST_NOT_FOUND', key });
    }

    return apiSuccess({
      key: list.key,
      tier: list.tier,
      label: list.label,
      options: list.options,
      visible: visibleOptions(list.options),
      fallback: list.fallback,
      isActive: list.isActive,
    });
  });
}
