DO $$ BEGIN
  CREATE TYPE "public"."notification_type" AS ENUM('PETROL_ELIGIBLE', 'PETROL_REMAINING', 'DRIVING_RESTRICTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."petrol_cycle_status" AS ENUM('OPEN', 'COMPLETED', 'SUPERSEDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."plate_parity" AS ENUM('ODD', 'EVEN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL UNIQUE,
  "name" text,
  "password_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vehicles" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "license_plate" text NOT NULL,
  "plate_parity" "plate_parity" NOT NULL,
  "parity_source" text DEFAULT 'auto' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "petrol_cycles" (
  "id" text PRIMARY KEY NOT NULL,
  "vehicle_id" text NOT NULL REFERENCES "public"."vehicles"("id") ON DELETE cascade,
  "cycle_number" integer NOT NULL,
  "status" "petrol_cycle_status" DEFAULT 'OPEN' NOT NULL,
  "allowed_litres" double precision NOT NULL,
  "completed_at" timestamp with time zone,
  "next_eligible_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "version" integer DEFAULT 0 NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "petrol_transactions" (
  "id" text PRIMARY KEY NOT NULL,
  "cycle_id" text NOT NULL REFERENCES "public"."petrol_cycles"("id") ON DELETE cascade,
  "litres" double precision NOT NULL,
  "transaction_at" timestamp with time zone NOT NULL,
  "station" text,
  "receipt_ref" text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
  "vehicle_id" text,
  "notification_date" date,
  "type" "notification_type" NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_settings" (
  "key" text PRIMARY KEY NOT NULL,
  "value" text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "notification_date" date;--> statement-breakpoint
UPDATE "notifications"
SET "notification_date" = ("created_at" AT TIME ZONE 'Asia/Yangon')::date
WHERE "notification_date" IS NULL;--> statement-breakpoint
DELETE FROM "notifications" older
USING "notifications" newer
WHERE older."id" <> newer."id"
  AND older."user_id" = newer."user_id"
  AND older."vehicle_id" = newer."vehicle_id"
  AND older."type" = newer."type"
  AND older."notification_date" = newer."notification_date"
  AND (older."created_at", older."id") < (newer."created_at", newer."id");--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "notification_date" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "petrol_cycles" ADD CONSTRAINT "petrol_cycles_cycle_number_positive" CHECK ("cycle_number" > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "petrol_cycles" ADD CONSTRAINT "petrol_cycles_allowed_litres_positive" CHECK ("allowed_litres" > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "petrol_cycles" ADD CONSTRAINT "petrol_cycles_version_nonnegative" CHECK ("version" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "petrol_transactions" ADD CONSTRAINT "petrol_transactions_litres_positive" CHECK ("litres" > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vehicles_user_id_idx" ON "vehicles" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "petrol_cycles_vehicle_cycle_idx" ON "petrol_cycles" ("vehicle_id", "cycle_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "petrol_cycles_vehicle_status_idx" ON "petrol_cycles" ("vehicle_id", "status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "petrol_transactions_cycle_id_idx" ON "petrol_transactions" ("cycle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_read_idx" ON "notifications" ("user_id", "read_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_daily_unique_idx" ON "notifications" ("user_id", "vehicle_id", "type", "notification_date");
