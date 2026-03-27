const SPACE_CHARS = /[\s\u3000]+/g;

export function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? "").normalize("NFKC").replace(SPACE_CHARS, "").toLowerCase();
}

export function matchesNormalizedSearch(
  query: string,
  candidates: Array<string | null | undefined>
): boolean {
  const needle = normalizeSearchText(query);
  if (!needle) return true;
  return candidates.some((candidate) => normalizeSearchText(candidate).includes(needle));
}
