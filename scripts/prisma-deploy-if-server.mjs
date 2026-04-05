const isServerEnv = Boolean(process.env.VERCEL) && Boolean(process.env.DATABASE_URL);

if (!isServerEnv) {
  console.log("Skipping prisma migrate deploy: Vercel/DATABASE_URL not detected");
  process.exit(0);
}

const { spawnSync } = await import("node:child_process");

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
