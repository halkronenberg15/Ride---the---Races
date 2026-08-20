/** Compose authored fragments without introducing punctuation at their join. */
export function composeSentences(...fragments: Array<string | undefined | null>) {
  return fragments
    .map(fragment => fragment?.trim())
    .filter((fragment): fragment is string => Boolean(fragment))
    .map((fragment, index, all) => index < all.length - 1
      ? `${fragment.replace(/[.!?]+\s*$/, '')}.`
      : fragment)
    .join(' ')
}
