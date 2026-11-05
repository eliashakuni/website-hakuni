import { defineRouting } from "next-intl/routing";
import { LANGUAGES } from "@/lib/languages";

export const routing = defineRouting({
  locales: LANGUAGES,
  defaultLocale: "fi",
  localeCookie: {
    maxAge: 60 * 60 * 24 * 365,
  },
});
