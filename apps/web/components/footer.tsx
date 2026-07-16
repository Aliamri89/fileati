import Link from "next/link";
import { Facebook, Instagram, Linkedin, Music2, Twitter, Youtube } from "lucide-react";
import {
  getLocalizedCategories,
  getLocalizedSiteConfig,
  getLocalizedToolsByCategory,
  type Locale,
} from "@tampdf/config";
import { Logo } from "@/components/logo";
import { Container } from "@/components/ui/container";
import { getDictionary } from "@/i18n/get-dictionary";
import { t } from "@/i18n/format";
import { getSettings } from "@/lib/get-settings";

const SOCIAL_ICONS = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Music2,
} as const;

const MAX_TOOLS_PER_COLUMN = 6;

interface FooterLink {
  label: string;
  href: string;
  accent?: boolean;
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={
                link.accent
                  ? "text-sm font-medium text-brand-500 transition-colors hover:text-brand-600"
                  : "text-sm text-foreground/60 transition-colors hover:text-brand-500"
              }
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const siteConfig = getLocalizedSiteConfig(locale);
  const categories = getLocalizedCategories(locale);
  const settings = await getSettings();
  const siteName = settings.siteName || siteConfig.name;
  const socialLinks = (settings.socialLinks ?? []).filter(
    (link): link is typeof link & { platform: keyof typeof SOCIAL_ICONS } =>
      Boolean(link.platform && link.url && link.platform in SOCIAL_ICONS),
  );

  const companyLinks: FooterLink[] = [
    { label: dict.footer.aboutUs, href: `/${locale}/about` },
    { label: dict.footer.contactUs, href: `/${locale}/contact` },
    { label: dict.footer.blog, href: `/${locale}/blog` },
    { label: dict.footer.faq, href: `/${locale}/faq` },
  ];

  const legalLinks: FooterLink[] = [
    { label: dict.footer.privacyPolicy, href: `/${locale}/privacy-policy` },
    { label: dict.footer.termsOfService, href: `/${locale}/terms-of-service` },
    { label: dict.footer.cookiePolicy, href: `/${locale}/cookie-policy` },
  ];

  return (
    <footer className="mt-24 border-t border-border bg-surface-muted/50">
      <Container className="py-14">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 sm:gap-10 lg:grid-cols-6">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Logo locale={locale} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground/60">
              {siteConfig.description}
            </p>
            {socialLinks.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                {socialLinks.map((link, index) => {
                  const SocialIcon = SOCIAL_ICONS[link.platform];
                  return (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.platform}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground/60 transition-colors hover:border-brand-300 hover:text-brand-600"
                    >
                      <SocialIcon size={15} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {categories.map((category) => {
            const categoryTools = getLocalizedToolsByCategory(category.id, locale);
            const visibleTools = categoryTools.slice(0, MAX_TOOLS_PER_COLUMN);
            const remaining = categoryTools.length - visibleTools.length;
            const links: FooterLink[] = visibleTools.map((tool) => ({
              label: tool.name,
              href: `/${locale}/${tool.slug}`,
            }));
            if (remaining > 0) {
              links.push({
                label: t(dict.footer.moreCount, { count: remaining }),
                href: `/${locale}#${category.id}`,
                accent: true,
              });
            }

            return <FooterColumn key={category.id} title={category.name} links={links} />;
          })}

          <FooterColumn title={dict.footer.company} links={companyLinks} />
          <FooterColumn title={dict.footer.legal} links={legalLinks} />
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-foreground/50 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {siteName}. {dict.footer.rights}
          </p>
          <p>{dict.footer.privacyNote}</p>
        </div>
      </Container>
    </footer>
  );
}
