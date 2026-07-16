"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FaqItem } from "@/lib/faqs";

/**
 * Pure presentation over data the Server Component already fetched — no
 * requests here, ever. Only one item's answer is expanded at a time; all
 * answers stay in the DOM (collapsed via a CSS grid-row transition, not
 * conditional rendering) so the full Q&A text is present in the initial
 * HTML for crawlers and doesn't need to be re-mounted on toggle.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = item.id === openId;
        return (
          <div
            key={item.id}
            id={`faq-${item.id}`}
            className="rounded-xl border border-border bg-surface"
          >
            <h3>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${item.id}`}
                className="flex w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-start font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span>{item.question}</span>
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 text-foreground/50 transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
            </h3>
            <div
              id={`faq-answer-${item.id}`}
              role="region"
              aria-labelledby={`faq-${item.id}`}
              className={cn(
                "grid px-5 transition-[grid-template-rows] duration-200 ease-out",
                isOpen ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden whitespace-pre-line text-sm leading-relaxed text-foreground/70">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
