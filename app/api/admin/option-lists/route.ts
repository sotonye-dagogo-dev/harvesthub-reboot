import { NextResponse } from 'next/server';
import { OPTION_LIST_KEYS } from '@/lib/config/optionLists';
import { getOptionList } from '@/lib/services/optionLists';
import { getCurrentUser } from '@/lib/utils/auth';
import { UserRole } from '@/lib/constants';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.ADMIN) return null;
  return user;
}

/**
 * GET /api/admin/option-lists
 * Admin inventory: every registered key with tier, row presence and editor metadata.
 */
export async function GET() {
  return withApiHandler('GET /api/admin/option-lists', async () => {
    const admin = await requireAdmin();
    if (!admin) return apiError('Forbidden', 403);

    const lists = await Promise.all(
      OPTION_LIST_KEYS.map(async (key) => {
        const list = await getOptionList(key);
        return list
          ? {
              key: list.key,
              tier: list.tier,
              label: list.label,
              count: list.options.length,
              fallback: list.fallback,
              isActive: list.isActive,
              updatedAt: list.updatedAt,
              updatedBy: list.updatedBy,
            }
          : null;
      }),
    );

    return apiSuccess({ lists: lists.filter(Boolean) });
  });
}
