-- Add missing church position enum values required by signup/vendor flows
DO $$
BEGIN
  ALTER TYPE "Position" ADD VALUE IF NOT EXISTS 'MEMBER';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TYPE "Position" ADD VALUE IF NOT EXISTS 'NON_MEMBER';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TYPE "Position" ADD VALUE IF NOT EXISTS 'WORKER';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
