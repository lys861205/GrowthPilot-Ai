CREATE TYPE "public"."blog_agent_status" AS ENUM('pending', 'running', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "blog_agent_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"audit_id" uuid,
	"status" "blog_agent_status" DEFAULT 'pending' NOT NULL,
	"ideas_generated" integer,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"audit_id" uuid,
	"topic" text NOT NULL,
	"primary_keyword" text NOT NULL,
	"secondary_keywords" jsonb DEFAULT '[]'::jsonb,
	"intent" text NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"priority_reason" text,
	"titles" jsonb DEFAULT '[]'::jsonb,
	"recommended_title" text,
	"outline" jsonb,
	"estimated_word_count" integer,
	"faq" jsonb DEFAULT '[]'::jsonb,
	"meta_title" text,
	"meta_description" text,
	"internal_links" jsonb DEFAULT '[]'::jsonb,
	"converted_to_post_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blog_agent_jobs" ADD CONSTRAINT "blog_agent_jobs_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_agent_jobs" ADD CONSTRAINT "blog_agent_jobs_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_ideas" ADD CONSTRAINT "blog_ideas_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_ideas" ADD CONSTRAINT "blog_ideas_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_ideas" ADD CONSTRAINT "blog_ideas_converted_to_post_id_blog_posts_id_fk" FOREIGN KEY ("converted_to_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_agent_jobs_site_id_idx" ON "blog_agent_jobs" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "blog_ideas_site_id_idx" ON "blog_ideas" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "blog_ideas_audit_id_idx" ON "blog_ideas" USING btree ("audit_id");