import type { Metadata } from "next";
import { Bree_Serif, Nunito } from "next/font/google";
import localFont from "next/font/local";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { OutdatedBrowserWarning } from "@/components/OutdatedBrowserWarning";
import { routing } from "@/i18n/routing";
import "../globals.css";

/**
 * Internet Explorer can't run the app's JavaScript, so it's turned away with CSS alone:
 * IE doesn't understand @supports, so for IE the app stays hidden and the notice stays visible.
 * Plain colours, because IE has no CSS variables either.
 */
const IE_BLOCK_CSS = `
.app-root{display:none}
.ie-notice{display:block;margin:15% auto;max-width:30em;padding:1em 1.5em;font:1.25em/1.5 sans-serif;color:#1d1d2e;background:#e6e6c8;border:4px solid #3a3a55}
@supports (display:grid){.app-root{display:contents}.ie-notice{display:none}}
`;

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["600", "800"],
});

const breeSerif = Bree_Serif({
  variable: "--font-bree-serif",
  subsets: ["latin"],
  weight: "400",
});

const digitalClock = localFont({
  variable: "--font-digital-clock",
  src: "../fonts/square_sans_serif_7.ttf",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: "Scramble", description: t("description") };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations("browser");

  return (
    <html
      lang={locale}
      className={`${nunito.variable} ${breeSerif.variable} ${digitalClock.variable} h-full antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: IE_BLOCK_CSS }} />
      </head>
      <body className="min-h-full font-semibold">
        <p className="ie-notice">{t("internetExplorer")}</p>
        <div className="app-root">
          <NextIntlClientProvider>
            <OutdatedBrowserWarning />
            {children}
          </NextIntlClientProvider>
        </div>
      </body>
    </html>
  );
}
