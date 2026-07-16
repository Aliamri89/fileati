import type { CollectionConfig } from "payload";

/**
 * Mirrors the tool slugs in packages/config/src/tools.ts. Deliberately not
 * imported from `@tampdf/config` here: that package resolves straight to
 * its TypeScript source (see its package.json `exports`), which Next.js's
 * bundler handles fine but Payload's own CLI (`payload migrate`,
 * `migrate:create`) cannot load — it evaluates this config file directly
 * under plain Node. Keep this list in sync if a tool slug is added,
 * renamed, or removed.
 */
const TOOL_OPTIONS = [
  { value: "compress-pdf", en: "Compress PDF", ar: "ضغط PDF" },
  { value: "pdf-to-jpg", en: "PDF to JPG", ar: "تحويل PDF إلى JPG" },
  { value: "merge-pdf", en: "Merge PDF", ar: "دمج PDF" },
  { value: "rotate-pdf", en: "Rotate PDF", ar: "تدوير PDF" },
  { value: "compress-image", en: "Compress Image", ar: "ضغط الصور" },
  { value: "image-to-pdf", en: "JPG to PDF", ar: "تحويل JPG إلى PDF" },
  { value: "rotate-images", en: "Rotate Images", ar: "تدوير الصور" },
] as const;

/**
 * Plain Q&A pairs for the public FAQ page. Deliberately a simple
 * draft/published `status` field rather than Payload's full versions
 * system (see StaticPages) — this collection is expected to scale to many
 * items, and skipping the versions table keeps every list/read query
 * against it a single, cheap lookup regardless of edit history.
 */
export const FAQs: CollectionConfig = {
  slug: "faqs",
  labels: {
    singular: { en: "FAQ", ar: "سؤال شائع" },
    plural: { en: "FAQs", ar: "الأسئلة الشائعة" },
  },
  admin: {
    useAsTitle: "question",
    defaultColumns: ["question", "status", "order"],
  },
  access: {
    // Public frontend queries always add `where: { status: { equals: "published" } }`
    // explicitly (Local API calls default to bypassing access control), so
    // this is defense-in-depth for direct REST/GraphQL access, not the
    // primary guard.
    read: ({ req }) => {
      if (req.user) return true;
      return { status: { equals: "published" } };
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "question",
      type: "text",
      required: true,
      localized: true,
      label: { en: "Question", ar: "السؤال" },
    },
    {
      name: "answer",
      type: "textarea",
      required: true,
      localized: true,
      label: { en: "Answer", ar: "الإجابة" },
      admin: {
        description: {
          en: "Plain text (line breaks are preserved). Keep answers short and scannable.",
          ar: "نص عادي (تُحفظ فواصل الأسطر). اجعل الإجابات قصيرة وسهلة القراءة.",
        },
      },
    },
    {
      name: "order",
      type: "number",
      required: true,
      defaultValue: 0,
      index: true,
      label: { en: "Order", ar: "الترتيب" },
      admin: {
        description: {
          en: "Lower numbers appear first on the FAQ page.",
          ar: "الأرقام الأصغر تظهر أولاً في صفحة الأسئلة الشائعة.",
        },
      },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      index: true,
      label: { en: "Status", ar: "الحالة" },
      options: [
        { label: { en: "Draft", ar: "مسودة" }, value: "draft" },
        { label: { en: "Published", ar: "منشور" }, value: "published" },
      ],
    },
    {
      // Not localized: which tool a question belongs to is an identity,
      // not translatable content — same as `key` on StaticPages. Left
      // empty, a FAQ is "global" and shows on the main FAQ page; set it to
      // scope the question to that tool's own page instead. Optional by
      // design so the existing global FAQ page keeps working unchanged.
      name: "tool",
      type: "select",
      required: false,
      index: true,
      label: { en: "Tool", ar: "الأداة" },
      options: TOOL_OPTIONS.map((tool) => ({
        label: { en: tool.en, ar: tool.ar },
        value: tool.value,
      })),
      admin: {
        description: {
          en: "Optional. Leave empty for a general question on the main FAQ page, or pick a tool to scope this question to that tool's page.",
          ar: "اختياري. اتركه فارغاً لسؤال عام في صفحة الأسئلة الشائعة الرئيسية، أو اختر أداة لربط هذا السؤال بصفحة تلك الأداة.",
        },
      },
    },
  ],
};
