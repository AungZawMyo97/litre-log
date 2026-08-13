CREATE TYPE "public"."notification_type" AS ENUM('PETROL_ELIGIBLE', 'PETROL_REMAINING', 'DRIVING_RESTRICTED');--> statement-breakpoint
CREATE TYPE "public"."petrol_cycle_status" AS ENUM('OPEN', 'COMPLETED', 'SUPERSEDED');--> statement-breakpoint
CREATE TYPE "public"."plate_parity" AS ENUM('ODD', 'EVEN');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"vehicle_id" text,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "petrol_cycles" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_id" text NOT NULL,
	"cycle_number" integer NOT NULL,
	"status" "petrol_cycle_status" DEFAULT 'OPEN' NOT NULL,
	"allowed_litres" double precision NOT NULL,
	"completed_at" timestamp with time zone,
	"next_eligible_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "petrol_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"cycle_id" text NOT NULL,
	"litres" double precision NOT NULL,
	"transaction_at" timestamp with time zone NOT NULL,
	"station" text,
	"receipt_ref" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"license_plate" text NOT NULL,
	"plate_parity" "plate_parity" NOT NULL,
	"parity_source" text DEFAULT 'auto' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petrol_cycles" ADD CONSTRAINT "petrol_cycles_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petrol_transactions" ADD CONSTRAINT "petrol_transactions_cycle_id_petrol_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."petrol_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE UNIQUE INDEX "petrol_cycles_vehicle_cycle_idx" ON "petrol_cycles" USING btree ("vehicle_id","cycle_number");--> statement-breakpoint
CREATE INDEX "petrol_cycles_vehicle_status_idx" ON "petrol_cycles" USING btree ("vehicle_id","status");--> statement-breakpoint
CREATE INDEX "petrol_transactions_cycle_id_idx" ON "petrol_transactions" USING btree ("cycle_id");--> statement-breakpoint
CREATE INDEX "vehicles_user_id_idx" ON "vehicles" USING btree ("user_id");