/**
 * Shared by next.config.ts (Node, at build time) and the browser check (client).
 * The supported range itself is the "browserslist" entry in package.json, which
 * also decides what the build compiles for, so the warning and the code agree.
 */

export type Engine = "chromium" | "gecko" | "webkit";
export type MinimumVersions = Record<Engine, number>;

const ENGINE_OF: Record<string, Engine> = {
  chrome: "chromium",
  edge: "chromium",
  and_chr: "chromium",
  firefox: "gecko",
  and_ff: "gecko",
  safari: "webkit",
  ios_saf: "webkit",
};

/** Turns browserslist output such as ["chrome 149", "ios_saf 26.5"] into the oldest version per engine. */
export function minimumVersions(browsers: readonly string[]): MinimumVersions {
  const minimums: MinimumVersions = { chromium: Infinity, gecko: Infinity, webkit: Infinity };
  for (const entry of browsers) {
    const [name, version] = entry.split(" ");
    const engine = ENGINE_OF[name];
    // Ranges like "ios_saf 26.0-26.1" count from their start.
    const parsed = parseFloat(version);
    if (engine && parsed < minimums[engine]) minimums[engine] = parsed;
  }
  return minimums;
}

/** Engine and version from a user agent, or null when it can't be told reliably. */
export function detectEngine(userAgent: string): { engine: Engine; version: number } | null {
  // Every iOS browser is Safari's engine, and its version follows the OS version.
  const ios = /(?:iPhone|iPad|iPod).* OS (\d+)_(\d+)/.exec(userAgent);
  if (ios) return { engine: "webkit", version: parseFloat(`${ios[1]}.${ios[2]}`) };

  const firefox = /Firefox\/(\d+)/.exec(userAgent);
  if (firefox) return { engine: "gecko", version: Number(firefox[1]) };

  // Chrome, Edge, Opera, Samsung Internet and other Chromium browsers all report Chrome/<version>.
  const chromium = /Chrom(?:e|ium)\/(\d+)/.exec(userAgent);
  if (chromium) return { engine: "chromium", version: Number(chromium[1]) };

  const safari = /Version\/(\d+(?:\.\d+)?).*Safari\//.exec(userAgent);
  if (safari) return { engine: "webkit", version: parseFloat(safari[1]) };

  return null;
}

/** Fallback for unrecognised browsers: the features the game can't work without. */
export function hasRequiredFeatures(): boolean {
  return (
    typeof HTMLDialogElement === "function" &&
    "showModal" in HTMLDialogElement.prototype &&
    typeof CSS !== "undefined" &&
    CSS.supports("container-type", "size") &&
    CSS.supports("height", "1dvh") &&
    CSS.supports("color", "color-mix(in srgb, red, blue)")
  );
}

export function isOutdated(userAgent: string, minimums: MinimumVersions): boolean {
  const detected = detectEngine(userAgent);
  if (!detected) return !hasRequiredFeatures();
  return detected.version < minimums[detected.engine];
}
