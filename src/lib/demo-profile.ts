import avatar from "@/assets/demo-avatar.jpg";

/** Sample data shown until real accounts are connected. */
export const demoProfile = {
  username: "nova",
  displayName: "Nova Reyes",
  alias: "novv",
  uid: 48213,
  avatar,
  bio: "designer · night owl · building small beautiful things on the internet",
  location: "Toronto",
  views: 12847,
  viewsLast7: [820, 1140, 960, 1420, 1310, 1780, 2045],
  badges: ["Premium", "Early supporter", "Verified"],
  links: [
    { label: "Portfolio", url: "https://example.com", icon: "globe" },
    { label: "Instagram", url: "https://instagram.com", icon: "instagram" },
    { label: "GitHub", url: "https://github.com", icon: "github" },
    { label: "YouTube", url: "https://youtube.com", icon: "youtube" },
  ],
} as const;
