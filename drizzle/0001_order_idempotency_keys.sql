CREATE TABLE "idempotency_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"scope" text DEFAULT 'ORDER_CREATE' NOT NULL,
	"request_hash" text NOT NULL,
	"resource_id" text,
	"response_code" integer,
	"response_body" json,
	"status" text DEFAULT 'IN_PROGRESS' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_keys_key_scope_idx" ON "idempotency_keys" USING btree ("key","scope");
