import path from "node:path";
import { fileURLToPath } from "node:url";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { ar } from "@payloadcms/translations/languages/ar";
import { en } from "@payloadcms/translations/languages/en";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Media } from "./payload/collections/Media";
import { PageVisitEvents } from "./payload/collections/PageVisitEvents";
import { Posts } from "./payload/collections/Posts";
import { StaticPages } from "./payload/collections/StaticPages";
import { ToolUsageEvents } from "./payload/collections/ToolUsageEvents";
import { Users } from "./payload/collections/Users";
import { Settings } from "./payload/globals/Settings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname, "payload"),
    },
    meta: {
      titleSuffix: " - TAMPDF Admin",
    },
    components: {
      views: {
        dashboard: {
          Component: "/components/Dashboard#Dashboard",
        },
      },
    },
  },
  collections: [Posts, StaticPages, Media, ToolUsageEvents, PageVisitEvents, Users],
  globals: [Settings],
  editor: lexicalEditor(),
  // Admin UI chrome (menus, buttons, validation/confirmation messages, dates)
  // is Arabic by default; English stays available per-user via Account →
  // Language. This is independent of `localization` below, which controls
  // bilingual document CONTENT (e.g. post title/body), not the UI itself.
  i18n: {
    supportedLanguages: { ar, en },
    fallbackLanguage: "ar",
  },
  secret: process.env.PAYLOAD_SECRET || "",
  // Optional: setting this to the site's real origin (e.g. https://tampdf.com)
  // makes Payload enforce a CSRF origin allowlist for authenticated requests.
  // Without it, the allowlist is empty and origin-checking is skipped
  // entirely — safe for this single-admin app, but stricter is better once
  // the production domain is known.
  serverURL: process.env.SERVER_URL || undefined,
  typescript: {
    outputFile: path.resolve(dirname, "payload/payload-types.ts"),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || `file:${path.resolve(dirname, "tampdf.db")}`,
    },
  }),
  // Payload's SharpDependency type is a narrower structural subset of the
  // installed sharp package's own (broader) type signature; this is a
  // known type-only mismatch, not a runtime issue.
  sharp: sharp as unknown as Parameters<typeof buildConfig>[0]["sharp"],
  localization: {
    locales: ["en", "ar"],
    defaultLocale: "en",
    fallback: true,
  },
});
