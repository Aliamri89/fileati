diff --git a/apps/web/payload.config.ts b/apps/web/payload.config.ts
index e8862d3..bf1a326 100644
--- a/apps/web/payload.config.ts
+++ b/apps/web/payload.config.ts
@@ -19,6 +19,21 @@ import { Settings } from "./payload/globals/Settings";
 const filename = fileURLToPath(import.meta.url);
 const dirname = path.dirname(filename);
 
+// Postgres pool sizing is phase-dependent because build and runtime pull in
+// opposite directions against Supabase's project-wide 15-connection Session
+// pooler cap. `next build` spins up several short-lived worker processes that
+// each open their own pool, so every build process must stay tiny for their
+// sum to fit under 15. Runtime, by contrast, is a SINGLE long-lived process
+// that must serve admin writes -- each of which holds a connection for a whole
+// transaction -- alongside frontend reads; capping it at 2 there starved every
+// write, which then failed to acquire a connection within
+// `connectionTimeoutMillis` (8s) and returned a 500 ("Something went wrong").
+// Override per environment with DATABASE_POOL_MAX if needed.
+const IS_BUILD_PHASE = process.env.NEXT_PHASE === "phase-production-build";
+const DB_POOL_MAX = Number(
+  process.env.DATABASE_POOL_MAX ?? (IS_BUILD_PHASE ? 2 : 8),
+);
+
 export default buildConfig({
   admin: {
     user: Users.slug,
@@ -69,23 +84,16 @@ export default buildConfig({
       ssl: process.env.DATABASE_URI?.includes("supabase.co")
         ? { rejectUnauthorized: false }
         : undefined,
-      // `pg` defaults to max: 10 per Pool instance, and this project's
-      // Supabase plan uses the Session pooler, which hard-caps the whole
-      // project at 15 concurrent connections total, shared across every
-      // process that ever connects — and measured directly against this
-      // database, none of them release their connections when they exit
-      // (confirmed via pg_stat_activity: idle backends from processes
-      // that had already finished were still sitting there minutes
-      // later). A single `next build` alone runs two separate phases
-      // ("Collecting page data" and "Generating static pages"), each
-      // spinning up its own worker processes (see next.config.ts's
-      // experimental.cpus), and each worker's connections stack on top
-      // of the previous phase's instead of replacing them, since nothing
-      // closes them when a worker's phase ends. That accumulation, plus
-      // the live app's own pool needing headroom at the same time, has
-      // to stay comfortably under 15 — not land on it. Keeping this
-      // small directly bounds how much a single build can accumulate.
-      max: 2,
+      // Phase-aware (see DB_POOL_MAX above): tiny during build so parallel
+      // build workers stay under Supabase's 15-connection cap, larger at
+      // runtime so admin writes don't starve behind frontend reads.
+      max: DB_POOL_MAX,
+      // Return idle connections to the pooler promptly instead of letting
+      // them linger toward the 15-connection cap, and let short-lived
+      // build/migrate workers release their connections when they go idle so
+      // they don't accumulate at the pooler across deploys.
+      idleTimeoutMillis: 10_000,
+      allowExitOnIdle: true,
       // `pg` has no default connection-acquisition timeout — if the pool
       // can't get a connection (e.g. the project is transiently at
       // Supabase's 15-connection Session pooler cap from something else
