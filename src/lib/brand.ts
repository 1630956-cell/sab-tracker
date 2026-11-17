/** Single source of truth for the myprofile brand. Change values here, not in pages. */
export const BRAND = {
  name: "myprofile",
  tagline: "Your corner of the internet, beautifully yours.",
  description:
    "myprofile is a premium platform to create, customize, share, and manage beautiful personal profile pages.",
  /** Public profile pages live at `${domain}/username`. */
  domain: "yourdomain.com",
  titles: {
    browser: "myprofile",
    dashboard: "myprofile Dashboard",
    login: "Welcome to myprofile",
    register: "Create your myprofile account",
    settings: "myprofile Settings",
    premium: "myprofile Premium",
  },
} as const;

export const profileUrl = (username: string) => `${BRAND.domain}/${username}`;

/** Builds a route head() meta list with consistent brand defaults. */
export function brandMeta(title: string, description: string = BRAND.description) {
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
}
