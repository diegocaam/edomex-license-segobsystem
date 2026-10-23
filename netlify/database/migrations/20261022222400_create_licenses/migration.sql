CREATE TABLE "licenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"token" uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
	"name" text NOT NULL,
	"folio" text NOT NULL UNIQUE,
	"type" text NOT NULL,
	"issued" date NOT NULL,
	"expires" date NOT NULL,
	"suspended" boolean DEFAULT false NOT NULL,
	"photo" uuid NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
