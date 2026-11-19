// ONE-TIME schema sync for Phase 2 (in-app currency). Remove after it has run once.
// Runs only on the Vercel *preview* build of the phase-2 branch, using the project's own DB env.
// `prisma db push` without --accept-data-loss refuses any destructive change, so it is additive-only here.
const ref = process.env.VERCEL_GIT_COMMIT_REF;
const isTarget =
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "preview" &&
  ref === "feature/phase2-app-currency" &&
  Boolean(process.env.DIRECT_URL || process.env.DATABASE_URL);

if (!isTarget) {
  console.log(`[db-push-once] skipped (env=${process.env.VERCEL_ENV ?? "local"}, ref=${ref ?? "n/a"})`);
  process.exit(0);
}

const { spawnSync } = await import("node:child_process");
console.log("[db-push-once] applying additive schema changes with `prisma db push`…");
const result = spawnSync("npx", ["prisma", "db", "push"], { stdio: "inherit", shell: process.platform === "win32" });
if (result.status !== 0) {
  console.error("[db-push-once] prisma db push failed — no destructive changes were applied. Failing the build.");
  process.exit(result.status ?? 1);
}
console.log("[db-push-once] schema is in sync.");
