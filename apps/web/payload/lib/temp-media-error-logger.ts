import fs from "node:fs";
import path from "node:path";
import type { AfterErrorHook } from "payload";

/**
 * TEMPORARY diagnostic logging for the recurring POST /api/media 503 on
 * the Hostinger deployment. Hostinger's Business-tier Node.js hosting
 * doesn't expose the running process's stdout/stderr anywhere in hPanel —
 * Payload already logs every error via `payload.logger`, but that output
 * has nowhere to land there — so this writes the same information to a
 * file inside the project instead, where it can be pulled via SSH or File
 * Manager after reproducing the failure.
 *
 * Wired in as Media's `hooks.afterError` (payload/collections/Media.ts) —
 * that hook fires with the exact error Payload caught, after Payload has
 * already built its normal response, and *before* that response is sent.
 * Returning nothing (as this does) leaves Payload's own status code and
 * response body completely untouched — this only observes and logs.
 *
 * TO REMOVE once the root cause is confirmed from the logged output:
 * 1. Delete this file.
 * 2. In payload/collections/Media.ts, remove the `hooks` block and its
 *    import of `logMediaUploadError`.
 * 3. Optionally delete the logs/ directory this printed and created.
 */

// `import.meta.url`-relative resolution isn't reliable here — after a
// production build, this file's compiled output gets bundled into
// Next.js's `.next/server` chunks, which don't preserve the source tree's
// directory layout, so a path built from *this file's own* location can
// resolve somewhere meaningless once bundled. `process.cwd()` is the
// directory the Node process itself was actually started from — the one
// thing that stays true regardless of how the bundler relocates code —
// so it's the only reliable root to resolve against at runtime. Rather
// than assume what that resolves to on Hostinger, the path is printed
// once at startup below so there's no need to guess.
const LOG_FILE = path.resolve(process.cwd(), "logs/runtime-errors.log");

// Printed once, when this module is first evaluated (i.e. on process
// startup, not per-request) — the goal is to know the exact absolute path
// without having to search for it, even if request-time logs themselves
// aren't visible anywhere in hPanel.
console.log(`[temp-media-error-logger] cwd=${process.cwd()}`);
console.log(`[temp-media-error-logger] diagnostic log file (absolute): ${LOG_FILE}`);

export const logMediaUploadError: AfterErrorHook = async ({ error, req }) => {
  if (req.method !== "POST") return;

  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

    const entry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      userId: req.user?.id ?? null,
      message: error.message,
      stack: error.stack,
      // Payload's own error classes (APIError and subclasses) carry a
      // `status`; not present on a bare Error, hence the cast+optional.
      status: (error as { status?: number }).status ?? null,
      name: error.name,
    };

    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
  } catch (loggingError) {
    // Never let this diagnostic ever break or mask the real error response.
    console.error("logMediaUploadError itself failed:", loggingError);
  }
};
