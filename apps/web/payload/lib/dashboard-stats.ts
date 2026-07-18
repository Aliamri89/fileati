import type { Payload } from "payload";
import { TOOL_SLUGS } from "../collections/ToolUsageEvents";

export interface DateWindowCounts {
  total: number;
  today: number;
  week: number;
  month: number;
}

export interface ToolStat {
  tool: string;
  uses: number;
  processedFiles: number;
  successCount: number;
  failedCount: number;
  lastUsage: string | null;
}

export interface RecentActivityItem {
  tool: string;
  success: boolean;
  createdAt: string;
}

export interface DashboardStats {
  visits: DateWindowCounts;
  processedFiles: DateWindowCounts;
  toolStats: ToolStat[];
  mostUsedTools: ToolStat[];
  recentActivity: RecentActivityItem[];
}

function getWindowStarts() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isoDayOfWeek = (startOfToday.getDay() + 6) % 7; // 0 = Monday
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - isoDayOfWeek);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startOfToday, startOfWeek, startOfMonth };
}

// `count(*)` comes back from pg as a bigint string; Number() is safe here
// (event counts stay well within 2^53) and keeps the DashboardStats numbers.
function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

// Postgres returns `timestamptz` as a JS Date via pg's default parser; the
// dashboard's interface (and its formatter) expect an ISO string.
function toIso(value: unknown): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value as string).toISOString();
}

/**
 * These stats are computed with a small set of aggregate SQL queries run
 * straight against the pg pool, rather than Payload's per-document
 * `count`/`find` operations. Reason: the dashboard needs windowed counts
 * plus per-tool breakdowns, which through the document API is dozens of
 * separate round-trips (4 window counts x 2 collections + 3 per tool x
 * every tool + recent activity) — all fired concurrently, which starves a
 * deliberately small connection pool and makes the whole /amriadmin page
 * hang under load. `GROUP BY` + `FILTER` collapse all of that into four
 * queries, each a single indexed scan over these small append-only tables.
 *
 * Trade-off: this couples to Payload's generated table/column names
 * (snake_case: `tool_usage_events`, `page_visit_events`, `created_at`,
 * `tool`, `success`). Those follow a stable convention, but if a collection
 * slug or field name changes, update the SQL here to match. Reading these
 * internal event tables directly (bypassing access control) is fine — this
 * is admin-only reporting code behind the admin panel's own auth.
 */
export async function getDashboardStats(payload: Payload): Promise<DashboardStats> {
  const { pool } = payload.db as unknown as { pool: import("pg").Pool };
  const { startOfToday, startOfWeek, startOfMonth } = getWindowStarts();
  const windowParams = [startOfToday.toISOString(), startOfWeek.toISOString(), startOfMonth.toISOString()];

  const [visitsResult, processedResult, toolStatsResult, recentResult] = await Promise.all([
    // 1. Page-visit counts across all four windows, in one pass.
    pool.query(
      `SELECT
         count(*) AS total,
         count(*) FILTER (WHERE created_at >= $1) AS today,
         count(*) FILTER (WHERE created_at >= $2) AS week,
         count(*) FILTER (WHERE created_at >= $3) AS month
       FROM page_visit_events`,
      windowParams,
    ),
    // 2. Successful tool runs ("processed files") across the same windows.
    pool.query(
      `SELECT
         count(*) FILTER (WHERE success) AS total,
         count(*) FILTER (WHERE success AND created_at >= $1) AS today,
         count(*) FILTER (WHERE success AND created_at >= $2) AS week,
         count(*) FILTER (WHERE success AND created_at >= $3) AS month
       FROM tool_usage_events`,
      windowParams,
    ),
    // 3. Per-tool breakdown for every tool that has any events, in one
    //    grouped pass (replaces 3 queries per tool).
    pool.query(
      `SELECT
         tool,
         count(*) AS uses,
         count(*) FILTER (WHERE success) AS success_count,
         max(created_at) AS last_usage
       FROM tool_usage_events
       GROUP BY tool`,
    ),
    // 4. Newest activity for the feed.
    pool.query(
      `SELECT tool, success, created_at
       FROM tool_usage_events
       ORDER BY created_at DESC
       LIMIT 10`,
    ),
  ]);

  const visitsRow = visitsResult.rows[0] ?? {};
  const visits: DateWindowCounts = {
    total: toNumber(visitsRow.total),
    today: toNumber(visitsRow.today),
    week: toNumber(visitsRow.week),
    month: toNumber(visitsRow.month),
  };

  const processedRow = processedResult.rows[0] ?? {};
  const processedFiles: DateWindowCounts = {
    total: toNumber(processedRow.total),
    today: toNumber(processedRow.today),
    week: toNumber(processedRow.week),
    month: toNumber(processedRow.month),
  };

  // Index the grouped rows by tool, then project onto the full tool list so
  // every tool still shows (with zeros) even if it has no events yet —
  // matching the previous behaviour.
  const byTool = new Map(toolStatsResult.rows.map((row) => [row.tool as string, row]));
  const toolStats: ToolStat[] = TOOL_SLUGS.map((tool) => {
    const row = byTool.get(tool);
    const uses = toNumber(row?.uses);
    const successCount = toNumber(row?.success_count);
    return {
      tool,
      uses,
      processedFiles: successCount,
      successCount,
      failedCount: uses - successCount,
      lastUsage: toIso(row?.last_usage),
    };
  });

  const mostUsedTools = [...toolStats].sort((a, b) => b.uses - a.uses).slice(0, 5);

  const recentActivity: RecentActivityItem[] = recentResult.rows.map((row) => ({
    tool: row.tool as string,
    success: row.success as boolean,
    createdAt: toIso(row.created_at) ?? "",
  }));

  return { visits, processedFiles, toolStats, mostUsedTools, recentActivity };
}
