import { Suspense } from "react";
import Script from "next/script";
import { GA4PageviewTracker } from "./ga4-pageview-tracker";

/** Google's documented GA4 Measurement ID format, e.g. "G-ABC1234DEF". */
const GA4_ID_PATTERN = /^G-[A-Z0-9]+$/;

/**
 * Renders Google Analytics 4's `gtag.js` loader + init snippet, plus a
 * pageview tracker that follows client-side navigation. No-ops (renders
 * nothing) when `measurementId` is falsy -- callers don't need to gate on
 * it themselves, which is what keeps `AnalyticsScripts` a flat,
 * unconditional list of providers.
 *
 * Also no-ops on a malformed id: `measurementId` is admin-entered free text
 * (Settings > Analytics) that gets interpolated directly into an inline
 * `<script>` below, so validating its shape first is cheap insurance
 * against a stray character breaking out of that string.
 */
export function GoogleAnalytics({ measurementId }: { measurementId?: string | null }) {
  if (!measurementId) return null;

  if (!GA4_ID_PATTERN.test(measurementId)) {
    console.error(
      `[GoogleAnalytics] Ignoring malformed GA4 Measurement ID (expected "G-XXXXXXXXXX"): ${measurementId}`,
    );
    return null;
  }

  return (
    <>
      <Script
        id="ga4-lib"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          // The automatic pageview GA4 would otherwise send right here is
          // disabled -- GA4PageviewTracker below is the single place that
          // ever sends a page_view, for both this first load and every
          // later client-side navigation, so nothing can double-count it.
          gtag('config', '${measurementId}', { send_page_view: false });
        `}
      </Script>
      {/* useSearchParams() (used inside the tracker) requires a Suspense
          boundary in the App Router, or Next.js forces this whole route to
          opt out of static rendering at build time. fallback={null} is fine
          -- there's nothing to visually render either way. */}
      <Suspense fallback={null}>
        <GA4PageviewTracker measurementId={measurementId} />
      </Suspense>
    </>
  );
}
