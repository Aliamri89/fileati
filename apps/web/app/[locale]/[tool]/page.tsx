import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Lock } from "lucide-react";
import {
  getLocalizedCategory,
  getLocalizedRelatedTools,
  getLocalizedSiteConfig,
  getLocalizedTool,
  isValidLocale,
  locales,
  tools,
  type Locale,
} from "@tampdf/config";
import { Icon } from "@/components/icon";
import { ToolCard } from "@/components/tools/tool-card";
import { ToolWorkspace } from "@/components/tools/workspace-map";
import { AccordionItem } from "@/components/ui/accordion";
import { Container } from "@/components/ui/container";
import { getDictionary } from "@/i18n/get-dictionary";
import { categoryStyles } from "@/lib/category-style";
import { safeJsonLd } from "@/lib/json-ld";

export function generateStaticParams() {
  return tools.map((tool) => ({ tool: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tool: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, tool: slug } = await params;
  if (!isValidLocale(rawLocale)) return {};
  const locale = rawLocale as Locale;
  const tool = getLocalizedTool(slug, locale);
  if (!tool) return {};

  const title = locale === "ar" ? `${tool.name} — أداة مجانية عبر الإنترنت` : `${tool.name} — Free Online Tool`;
  const description = tool.shortDescription;
  const path = `/${tool.slug}`;

  return {
    title,
    description,
    keywords: tool.keywords,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])),
        "x-default": `/en${path}`,
      },
    },
    openGraph: { title, description, url: `/${locale}${path}` },
    twitter: { title, description },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ locale: string; tool: string }>;
}) {
  const { locale: rawLocale, tool: slug } = await params;
  if (!isValidLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const tool = getLocalizedTool(slug, locale);
  if (!tool) notFound();

  const dict = getDictionary(locale);
  const siteConfig = getLocalizedSiteConfig(locale);
  const category = getLocalizedCategory(tool.category, locale);
  const relatedTools = getLocalizedRelatedTools(tool, locale);
  const style = categoryStyles[tool.category];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${siteConfig.name} ${tool.name}`,
    applicationCategory: "Utility",
    operatingSystem: "Any (web-based)",
    description: tool.shortDescription,
    url: `${siteConfig.url}/${locale}/${tool.slug}`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    inLanguage: locale,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(softwareJsonLd) }}
      />

      <Container className="pt-8">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-foreground/50"
        >
          <Link href={`/${locale}`} className="hover:text-foreground">
            {dict.breadcrumb.home}
          </Link>
          {category && (
            <>
              <ChevronRight size={14} className="rtl:rotate-180" />
              <Link href={`/${locale}#${category.id}`} className="hover:text-foreground">
                {category.name}
              </Link>
            </>
          )}
          <ChevronRight size={14} className="rtl:rotate-180" />
          <span className="text-foreground/80">{tool.name}</span>
        </nav>
      </Container>

      <Container className="pt-6 pb-4 text-center">
        <span
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${style.iconBg} ${style.iconText}`}
        >
          <Icon name={tool.icon} size={28} />
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {tool.name}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-foreground/60">{tool.shortDescription}</p>
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-foreground/50">
          <Lock size={13} /> {dict.tool.processedClient}
        </p>
      </Container>

      <Container maxWidth="2xl" className="pb-16">
        <ToolWorkspace slug={tool.slug} />
      </Container>

      <Container maxWidth="2xl" className="pb-16">
        <div className="space-y-4 text-foreground/70">
          {tool.longDescription.map((paragraph, i) => (
            <p key={i} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </Container>

      <Container maxWidth="2xl" className="pb-16">
        <h2 className="text-xl font-semibold">{dict.tool.faqHeading}</h2>
        <div className="mt-5 space-y-3">
          {tool.faq.map((item, i) => (
            <AccordionItem key={item.question} question={item.question} defaultOpen={i === 0}>
              {item.answer}
            </AccordionItem>
          ))}
        </div>
      </Container>

      {relatedTools.length > 0 && (
        <Container className="pb-20">
          <h2 className="text-xl font-semibold">{dict.tool.relatedHeading}</h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedTools.map((related) => (
              <ToolCard key={related.slug} tool={related} locale={locale} />
            ))}
          </div>
        </Container>
      )}
    </>
  );
}
