-- Add primary campus to users so campus is collected and persisted for every
-- registered account (buyers and vendors), not just vendors.
ALTER TABLE "users" ADD COLUMN "campus" "Campus";