/** Index of the first element >= target in an ascending array (arr.length if none). */
export function lowerBound<T extends string | number>(
  sorted: readonly T[],
  target: T,
): number {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (sorted[mid] < target) low = mid + 1;
    else high = mid;
  }
  return low;
}

export function hasWord(sorted: readonly string[], word: string): boolean {
  return sorted[lowerBound(sorted, word)] === word;
}

/** True if some word longer than `prefix` starts with it. */
export function hasLongerWordWithPrefix(
  sorted: readonly string[],
  prefix: string,
): boolean {
  let i = lowerBound(sorted, prefix);
  if (sorted[i] === prefix) i++;
  return i < sorted.length && sorted[i].startsWith(prefix);
}
