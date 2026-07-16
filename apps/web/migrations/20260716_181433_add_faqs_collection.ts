import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_faqs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_faqs_tool" AS ENUM('compress-pdf', 'pdf-to-jpg', 'merge-pdf', 'rotate-pdf', 'compress-image', 'image-to-pdf', 'rotate-images');
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"status" "enum_faqs_status" DEFAULT 'draft' NOT NULL,
  	"tool" "enum_faqs_tool",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faqs_locales" (
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "faqs_id" integer;
  ALTER TABLE "faqs_locales" ADD CONSTRAINT "faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "faqs_order_idx" ON "faqs" USING btree ("order");
  CREATE INDEX "faqs_status_idx" ON "faqs" USING btree ("status");
  CREATE INDEX "faqs_tool_idx" ON "faqs" USING btree ("tool");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE UNIQUE INDEX "faqs_locales_locale_parent_id_unique" ON "faqs_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "faqs_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "faqs_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_faqs_fk";
  
  DROP INDEX "payload_locked_documents_rels_faqs_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "faqs_id";
  DROP TYPE "public"."enum_faqs_status";
  DROP TYPE "public"."enum_faqs_tool";`)
}
