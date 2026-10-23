import { NextRequest, NextResponse } from 'next/server';
import {
  OptionListValidationError,
  getOptionList,
  upsertOptionList,
} from '@/lib/services/optionLists';
import { OPTION_LIST_DEFINITIONS, isOptionListKey } from '@/lib/config/optionLists';
import { getCurrentUser } from '@/lib/utils/auth';
import { UserRole } from '@/lib/constants';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

interface RouteContext {
  params: Promise<{ key: string }>;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.ADMIN) return null;
  return user;
}

/**
 * GET /api/admin/option-lists/[key] — full row (including hidden options).
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  return withApiHandler('GET /api/admin/option-lists/[key]', async () => {
    const admin = await requireAdmin();
    if (!admin) return apiError('Forbidden', 403);

    const { key } = await context.params;
    const list = await getOptionList(key, { bypassCache: true });
    if (!list || !isOptionListKey(key)) {
      return apiError('Option list not found', 404, { code: 'OPTION_LIST_NOT_FOUND', key });
    }

    const definition = OPTION_LIST_DEFINITIONS[key];
    return apiSuccess({
      list: {
        ...list,
        allowedValues: definition.allowedValues ?? null,
        maxOptions: definition.maxOptions ?? null,
        description: definition.description ?? null,
      },
    });
  });
}

/**
 * PUT /api/admin/option-lists/[key] — validate + persist.
 *
 * DISPLAY lists may only be relabelled / reordered / hidden: the server always
 * validates against the code/Prisma enum key set.
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  return withApiHandler('PUT /api/admin/option-lists/[key]', async () => {
    const admin = await requireAdmin();
    if (!admin) return apiError('Forbidden', 403);

    const { key } = await context.params;
    if (!isOptionListKey(key)) {
      return apiError('Option list not found', 404, { code: 'OPTION_LIST_NOT_FOUND', key });
    }

    const body = (await req.json().catch(() => null)) as { options?: unknown } | null;
    if (!body || typeof body.options === 'undefined') {
      return apiError('Request body must include an "options" array', 400, {
        code: 'OPTION_LIST_INVALID_OPTIONS',
      });
    }

    try {
      const saved = await upsertOptionList(key, body.options, admin.userId);
      return apiSuccess({ list: saved });
    } catch (error) {
      if (error instanceof OptionListValidationError) {
        const status = error.code === 'OPTION_LIST_NOT_FOUND' ? 404 : 400;
        return apiError(error.message, status, { code: error.code });
      }
      throw error;
    }
  });
}
