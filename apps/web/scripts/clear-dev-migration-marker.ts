import config from "@payload-config";
import { getPayload } from "payload";

/**
 * `payload migrate` interactively prompts ("data loss will occur, proceed?")
 * whenever it finds a `batch: -1` row in `payload-migrations` — the marker
 * Payload's dev-mode schema push writes when `next dev` is pointed at a
 * database. That prompt has no non-interactive override, so it hangs/crashes
 * a CI build with no TTY attached (see Hostinger build logs).
 *
 * This only removes that internal bookkeeping marker, never real content —
 * `payload migrate` still runs the actual migration files normally after.
 * Runs before `payload migrate` in the `build` script so production builds
 * can never hit that prompt, regardless of whether dev mode was ever run
 * against this database.
 */
async function main() {
  // Must be set before getPayload() — same guard Payload's own `migrate`
  // CLI uses — otherwise this script's own init would re-trigger dev-mode
  // schema push (and re-write the very marker being removed here).
  process.env.PAYLOAD_MIGRATING = "true";
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "payload-migrations",
    where: { batch: { equals: -1 } },
    limit: 0,
  });

  for (const doc of docs) {
    await payload.delete({ collection: "payload-migrations", id: doc.id });
  }

  payload.logger.info(`clear-dev-migration-marker: removed ${docs.length} dev-mode schema-push marker(s).`);

  // Without this, the process exits while the pool's TCP connections are
  // still open — Supabase's pooler doesn't reclaim those as fast as a
  // clean disconnect, so every build run leaves connections lingering
  // toward the project's 15-connection cap instead of releasing them.
  await payload.destroy();
}

await main();
