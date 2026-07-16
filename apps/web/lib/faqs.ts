import type { Locale } from "@tampdf/config";
import { getPayloadClient } from "@/lib/payload-client";

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

/**
 * Fetches every published FAQ in one query, sorted for display. No
 * pagination — the accordion is a single flat list, so page components
 * should call this once and pass the full result down as props (no
 * per-item requests on expand/collapse).
 *
 * Pass `toolSlug` to get the FAQs scoped to that tool (e.g. "compress-pdf")
 * instead of the general list — a document only ever belongs to one or the
 * other, so this is never additive with the global set.
 */
export async function getFaqs(locale: Locale, toolSlug?: string): Promise<FaqItem[]> {
  try {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "faqs",
      where: {
        status: { equals: "published" },
        tool: toolSlug ? { equals: toolSlug } : { exists: false },
      },
      sort: "order",
      locale,
      depth: 0,
      limit: 0,
      pagination: false,
      select: { question: true, answer: true },
    });
    return docs.map((doc) => ({
      id: doc.id,
      question: doc.question ?? "",
      answer: doc.answer ?? "",
    }));
  } catch (error) {
    // Database unreachable or not yet migrated — an empty list lets the
    // page render its empty-state copy instead of crashing.
    console.error("getFaqs failed, returning empty list:", error);
    return [];
  }
}
