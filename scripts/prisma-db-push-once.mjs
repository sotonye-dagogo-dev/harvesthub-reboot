// ONE-TIME schema sync for the banner sponsorship fields (approved by the product owner). Remove after it runs.
// Runs only on the Vercel *preview* build of feature/top-strip-ads, using the project's own DB env.
// `prisma db push` without --accept-data-loss refuses destructive changes (additive-only).
const ref = process.env.VERCEL_GIT_COMMIT_REF;
const isTarget =
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "preview" &&
  ref === "feature/top-strip-ads" &&
  Boolean(process.env.DIRECT_URL || process.env.DATABASE_URL);

if (!isTarget) {
  console.log(`[db-push-once] skipped (env=${process.env.VERCEL_ENV ?? "local"}, ref=${ref ?? "n/a"})`);
  process.exit(0);
}

const { spawnSync } = await import("node:child_process");
console.log("[db-push-once] applying additive schema changes with `prisma db push`…");
const push = spawnSync("npx", ["prisma", "db", "push"], { stdio: "inherit" });
if (push.status !== 0) {
  console.error("[db-push-once] prisma db push failed — nothing destructive was applied. Failing the build.");
  process.exit(push.status ?? 1);
}

// Approved data change: mark the existing alongng.com top advert as sponsored (idempotent).
const sql = `UPDATE "banners" SET "isSponsored" = true WHERE "id" = 'cmv65zd9l000304jt77zz5tct';`;
const exec = spawnSync("npx", ["prisma", "db", "execute", "--stdin"], {
  input: sql,
  stdio: ["pipe", "inherit", "inherit"],
});
console.log(
  exec.status === 0
    ? "[db-push-once] alongng.com advert marked as sponsored."
    : "[db-push-once] could not mark the alongng.com advert (db execute failed) — do it in Operations → Banners."
);
console.log("[db-push-once] done.");
