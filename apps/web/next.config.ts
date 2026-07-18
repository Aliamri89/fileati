import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@tampdf/config"],
  experimental: {
    // Each static-generation worker is a separate process that opens its
    // own DB pool (capped at 5, see payload.config.ts) — left at Next's
    // default (CPU core count), a build can spin up several of these at
    // once, and none of them get an explicit close() when the worker
    // exits, so their connections linger at the pooler until it times
    // them out. Measured directly against this project's Supabase Session
    // pooler (hard-capped at 15 connections, project-wide): the default
    // worker count pushed a single build's peak usage to exactly 15, with
    // zero headroom for the live app running at the same time. Capping
    // workers at 2 keeps a build's peak well under that ceiling.
    cpus: 1,
  },
  // Hostinger's deployment environment (and some other setups) can end up
  // with a second, stale package-lock.json sitting above this monorepo's
  // real root (e.g. a duplicated/legacy checkout in public_html alongside
  // the actual build checkout). Turbopack's automatic workspace-root
  // inference picks whichever lockfile it finds first walking up the tree,
  // which can silently select the wrong root and misplace build output.
  // Pin it explicitly: apps/web -> apps -> repo root.
  turbopack: {
    root: path.join(dirname, "..", ".."),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Belt-and-suspenders alongside robots.txt: this actually prevents
        // indexing (robots.txt only requests crawlers not to crawl, which
        // doesn't stop a page from being indexed if linked from elsewhere).
        source: "/amriadmin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
