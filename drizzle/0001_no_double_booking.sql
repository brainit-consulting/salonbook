-- Two live bookings for the same stylist may never overlap in time.
-- The database enforces this itself, so it holds even when two people press
-- "book" at the same instant. Cancelled bookings are ignored, which is what
-- frees a slot again. '[)' means the end time is not part of the booking, so
-- a 10:00-10:45 cut and a 10:45 start can sit back to back.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    "stylist_id" WITH =,
    tstzrange("starts_at", "ends_at", '[)') WITH &&
  ) WHERE ("status" = 'booked');
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_ends_after_start" CHECK ("ends_at" > "starts_at");
