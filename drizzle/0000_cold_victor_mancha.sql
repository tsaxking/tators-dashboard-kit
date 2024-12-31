CREATE TABLE IF NOT EXISTS "account" (
	"id" text PRIMARY KEY NOT NULL,
	"created" timestamp NOT NULL,
	"updated" timestamp NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"universes" text NOT NULL,
	"attributes" text NOT NULL,
	"lifetime" integer NOT NULL,
	"username" text NOT NULL,
	"key" text NOT NULL,
	"salt" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"picture" text NOT NULL,
	"verified" boolean NOT NULL,
	"verification" text NOT NULL,
	CONSTRAINT "account_username_unique" UNIQUE("username"),
	CONSTRAINT "account_key_unique" UNIQUE("key"),
	CONSTRAINT "account_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admins" (
	"id" text PRIMARY KEY NOT NULL,
	"created" timestamp NOT NULL,
	"updated" timestamp NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"universes" text NOT NULL,
	"attributes" text NOT NULL,
	"lifetime" integer NOT NULL,
	"account_id" text NOT NULL,
	CONSTRAINT "admins_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_account" (
	"id" text PRIMARY KEY NOT NULL,
	"created" timestamp NOT NULL,
	"updated" timestamp NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"universes" text NOT NULL,
	"attributes" text NOT NULL,
	"lifetime" integer NOT NULL,
	"role" text NOT NULL,
	"account" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role" (
	"id" text PRIMARY KEY NOT NULL,
	"created" timestamp NOT NULL,
	"updated" timestamp NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"universes" text NOT NULL,
	"attributes" text NOT NULL,
	"lifetime" integer NOT NULL,
	"name" text NOT NULL,
	"universe" text NOT NULL,
	"description" text NOT NULL,
	"permissions" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "universe" (
	"id" text PRIMARY KEY NOT NULL,
	"created" timestamp NOT NULL,
	"updated" timestamp NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"universes" text NOT NULL,
	"attributes" text NOT NULL,
	"lifetime" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"created" timestamp NOT NULL,
	"updated" timestamp NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"universes" text NOT NULL,
	"attributes" text NOT NULL,
	"lifetime" integer NOT NULL,
	"account_id" text NOT NULL,
	"ip" text NOT NULL,
	"user_agent" text NOT NULL,
	"requests" integer NOT NULL,
	"prev_url" text NOT NULL
);
