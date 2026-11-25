import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { routing } from "@/i18n/routing";
import type { Language } from "@/lib/languages";
import en from "@/messages/en.json";
import fi from "@/messages/fi.json";
import sv from "@/messages/sv.json";
import "./globals.css";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: "600" });

const MESSAGES: Record<Language, typeof fi> = { fi, sv, en };

export const metadata: Metadata = { title: "404 - Scramble" };

/** Runs without a locale, as it skips the [locale] root layout, so it speaks every language. */
export default function GlobalNotFound() {
  return (
    <html lang={routing.defaultLocale} className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col items-center justify-center gap-8 font-semibold text-white">
        {routing.locales.map((locale) => (
          <section key={locale} lang={locale} className="flex flex-col items-center gap-1">
            <p className="text-xl">{MESSAGES[locale].notFound.message}</p>
            <a href={`/${locale}`} className="underline underline-offset-4">
              {MESSAGES[locale].notFound.home}
            </a>
          </section>
        ))}
      </body>
    </html>
  );
}
