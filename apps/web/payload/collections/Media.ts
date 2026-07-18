import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CollectionConfig } from "payload";
// TEMPORARY — see payload/lib/temp-media-error-logger.ts for what this is
// and exactly how to remove it once the Hostinger 503 is root-caused.
import { logMediaUploadError } from "../lib/temp-media-error-logger";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    singular: { en: "Media", ar: "وسيط" },
    plural: { en: "Media", ar: "الوسائط" },
  },
  // TEMPORARY — remove this `hooks` block together with the import above
  // when removing the diagnostic logger.
  hooks: {
    afterError: [logMediaUploadError],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  upload: {
    staticDir: path.resolve(dirname, "../../media-uploads"),
    mimeTypes: ["image/*"],
    imageSizes: [
      { name: "thumbnail", width: 300, height: 300, position: "centre" },
      { name: "og", width: 1200, height: 630, position: "centre" },
      // Aspect-preserving (no crop) sizes for responsive `srcset` on article
      // featured images — `og`'s fixed 1.9:1 crop would distort most source
      // photos if used outside social-share previews.
      { name: "medium", width: 800 },
      { name: "large", width: 1600 },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      label: { en: "Alt Text", ar: "النص البديل" },
      admin: {
        description: {
          en: "Describes the image for screen readers and SEO.",
          ar: "يصف الصورة لقارئات الشاشة ولتحسين محركات البحث.",
        },
      },
    },
  ],
};
