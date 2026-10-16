CREATE TYPE "public"."brew_method" AS ENUM('gongfu', 'western', 'grandpa', 'cold');--> statement-breakpoint
CREATE TYPE "public"."tea_type" AS ENUM('green', 'black', 'oolong', 'white', 'puerh', 'herbal');--> statement-breakpoint
CREATE TABLE "tasting_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"tea_id" text NOT NULL,
	"rating" integer NOT NULL,
	"notes" text,
	"brewed_at" timestamp with time zone NOT NULL,
	"brew_method" "brew_method"
);
--> statement-breakpoint
CREATE TABLE "teas" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "tea_type" NOT NULL,
	"vendor" text,
	"region" text
);
--> statement-breakpoint
ALTER TABLE "tasting_notes" ADD CONSTRAINT "tasting_notes_tea_id_teas_id_fk" FOREIGN KEY ("tea_id") REFERENCES "public"."teas"("id") ON DELETE no action ON UPDATE no action;