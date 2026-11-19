/** Single source of truth for brand strings. */
export const BRAND = {
  name: "BrainrotIntel",
  tagline: "Live tracker for Steal a Brainrot",
  description:
    "Live player count, every Steal a Brainrot update, and everything known about creator Sammy (SpyderSammy).",
} as const;

export function brandMeta(title: string, description: string = BRAND.description) {
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ];
}
