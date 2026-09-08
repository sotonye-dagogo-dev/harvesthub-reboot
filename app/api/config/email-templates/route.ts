import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_EMAIL_TEMPLATES } from "@/lib/config/emailTemplates";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key")?.trim();
    if (key) {
      const row = await prisma.emailTemplate.findUnique({ where: { key } }).catch(() => null);
      const def = DEFAULT_EMAIL_TEMPLATES[key];
      if (row) {
        return NextResponse.json({ success: true, template: { key: row.key, subject: row.subject, body: row.body, variables: row.variables } });
      }
      if (def) {
        return NextResponse.json({ success: true, template: { key: def.key, subject: def.defaultSubject, body: def.defaultBody, variables: def.variables }, fallback: true });
      }
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    const rows = await prisma.emailTemplate.findMany().catch(() => []);
    const merged = Object.values(DEFAULT_EMAIL_TEMPLATES).map((def) => {
      const row = rows.find((r: { key: string }) => r.key === def.key);
      return row ? { key: row.key, subject: row.subject, body: row.body, variables: row.variables, isActive: row.isActive } : { key: def.key, subject: def.defaultSubject, body: def.defaultBody, variables: def.variables, isActive: true, fallback: true };
    });
    return NextResponse.json({ success: true, templates: merged });
  } catch (e) {
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
  }
}
