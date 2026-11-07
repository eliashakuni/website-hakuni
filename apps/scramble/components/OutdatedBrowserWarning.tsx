"use client";

import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { isOutdated, type MinimumVersions } from "@/lib/browserSupport";

const MINIMUMS: MinimumVersions = JSON.parse(process.env.BROWSER_MINIMUMS!);
const DISMISSED_KEY = "scramble:outdated-browser-dismissed";

const subscribe = () => () => {};
const getOutdated = () => isOutdated(navigator.userAgent, MINIMUMS);
const getServerOutdated = () => false;

function wasDismissed() {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function OutdatedBrowserWarning() {
  const t = useTranslations("browser");
  const outdated = useSyncExternalStore(subscribe, getOutdated, getServerOutdated);
  const dismissedEarlier = useSyncExternalStore(subscribe, wasDismissed, getServerOutdated);
  const [dismissed, setDismissed] = useState(false);

  if (!outdated || dismissed || dismissedEarlier) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Not remembered, so it shows again after a reload.
    }
  };

  return (
    <div
      role="alert"
      className="fixed inset-x-3 top-3 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-2xl border-4 border-dialog-edge bg-dialog px-4 py-3 text-ink shadow-xl"
    >
      <p className="flex-1">{t("outdated")}</p>
      <button onClick={dismiss} className="rounded-lg px-2 py-1 underline underline-offset-4">
        {t("dismiss")}
      </button>
    </div>
  );
}
