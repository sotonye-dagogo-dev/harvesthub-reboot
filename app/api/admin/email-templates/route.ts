import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/utils/auth";
import { UserRole } from "@/lib/constants";
import { DEFAULT_EMAIL_TEMPLATES } from "@/lib/config/emailTemplates";
import { apiError, apiSuccess, withApiHandler } from "@/lib/api/http";

export async function GET(req: NextRequest) {
  return withApiHandler("GET /api/admin/email-templates", async () => {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);
    if (user.role !== UserRole.ADMIN) return apiError("Forbidden", 403);
    const rows = await prisma.emailTemplate.findMany({ orderBy: { key: "asc" } }).catch(() => []);
    const merged = Object.values(DEFAULT_EMAIL_TEMPLATES).map((def) => {
      const row = rows.find((r) => r.key === def.key);
      return row ? { ...row, label: def.label, description: def.description, fallback: false } : { key: def.key, subject: def.defaultSubject, body: def.defaultBody, variables: def.variables, isActive: true, label: def.label, description: def.description, fallback: true };
    });
    return apiSuccess({ templates: merged });
  });
}

export async function PUT(req: NextRequest) {
  return withApiHandler("PUT /api/admin/email-templates", async () => {
    const user = await getCurrentUser();
    if (!user) return apiError("Unauthorized", 401);
    if (user.role !== UserRole.ADMIN) return apiError("Forbidden", 403);
    const body = await req.json().catch(() => ({}));
    const key = typeof body.key === "string" ? body.key.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const bodyText = typeof body.body === "string" ? body.body : "";
    if (!key || !subject || !bodyText) return apiError("key, subject and body are required", 400);
    const def = DEFAULT_EMAIL_TEMPLATES[key];
    if (!def) return apiError("Unknown template key", 400);
    const upserted = await prisma.emailTemplate.upsert({
      where: { key },
      update: { subject, body: bodyText, variables: def.variables, isActive: body.isActive !== false, updatedBy: user.userId },
      create: { key, subject, body: bodyText, variables: def.variables, isActive: true, updatedBy: user.userId },
    });
    return apiSuccess({ template: upserted });
  });
}
