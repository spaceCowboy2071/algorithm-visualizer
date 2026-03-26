// src/utils/complexityValidator.ts
// Pure functions for normalizing and validating Big-O complexity strings.

export interface AcceptedComplexity {
  time: string;
  space: string;
  approach?: string;
}

/**
 * Normalize a complexity string to a canonical form for comparison.
 *
 * Handles: O(n), o(N), O( n ), O(n^2), O(nlogn), O(n log n),
 * O(n*logn), O(n log(n)), O(mn), O(m*n), O(V+E), etc.
 */
export function normalizeComplexity(input: string): string {
  if (!input.trim()) return '';

  let s = input.trim().toLowerCase();

  // Remove all whitespace
  s = s.replace(/\s+/g, '');

  // Strip outer O(...) wrapper
  const oMatch = s.match(/^o\((.+)\)$/);
  let inner = oMatch ? oMatch[1] : s;

  // Normalize log variants: log2(n), log₂(n), lg(n), log(n) -> logn
  inner = inner.replace(/log[₂2]?\(([a-z])\)/g, 'log$1');
  inner = inner.replace(/lg\(([a-z])\)/g, 'log$1');

  // Remove multiplication symbols
  inner = inner.replace(/[*·×]/g, '');

  // Remove parens around single variables: (n) -> n
  inner = inner.replace(/\(([a-z])\)/g, '$1');

  // Sort adjacent single-letter variable products: nm -> mn
  // But preserve things like logn, 2^n, 4^l, min(m,n)
  inner = inner.replace(/([a-z])([a-z])(?![a-z(^])/g, (_match, a, b) => {
    // Don't sort if part of a keyword like "log", "min", "max"
    return a <= b ? a + b : b + a;
  });

  return `O(${inner})`;
}

/**
 * Check if user-entered time+space matches any accepted pair.
 * Returns the matching approach label if found, or null if no match.
 */
export function validateComplexity(
  userTime: string,
  userSpace: string,
  accepted: AcceptedComplexity[],
): { match: boolean; approach?: string } {
  const normTime = normalizeComplexity(userTime);
  const normSpace = normalizeComplexity(userSpace);

  if (!normTime || !normSpace) return { match: false };

  for (const entry of accepted) {
    if (normalizeComplexity(entry.time) === normTime && normalizeComplexity(entry.space) === normSpace) {
      return { match: true, approach: entry.approach };
    }
  }

  return { match: false };
}
