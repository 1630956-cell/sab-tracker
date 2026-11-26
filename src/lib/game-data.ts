export const GAME = {
  name: "Steal a Brainrot",
  placeId: "109983668079237",
  universeId: "7709344486",
  groupId: "35815907",
  groupName: "BRAZILIAN SPYDER",
  released: "May 16, 2025",
  url: "https://www.roblox.com/games/109983668079237/Steal-a-Brainrot",
};

export type Update = { n: number; date: string; title: string; items: string[] };

/** Seed database of known updates, newest first. Gemini refresh adds newer ones live. */
export const UPDATES: Update[] = [
  { n: 76, date: "2026-11-21", title: "New Bros + Hacker Mutation", items: ["Hacker mutation — multiplier not published by the devs (community says ~15×)", "Kitsune — Secret, $240M/s (DLC)", "Papafrito (bear in french fries) — Secret, $105M/s (DLC)", "Puffin Muffin — Brainrot God, $324.5K/s (DLC)", "Ball Bros — Secret, $125M/s (Bros Machine craft)", "Timmy Bros — Secret, $7.25M/s (Bros Machine craft — ingredient pair not documented)", "Slushi Huski — Brainrot God, $322.5K/s"] },
  { n: 75, date: "2026-11-14", title: "Bros Machine", items: ["New Bros Machine", "Brainrot buffs"] },
  { n: 74, date: "2026-11-07", title: "Red Carpet Brainrots", items: ["Balloon Baboon (Secret) — $23.5M/s", "Bling Luming (Secret) — $2.6M/s", "Eclipse Admin Machine (community-reported)"] },
  { n: 73, date: "2026-10-31", title: "Halloween Trick or Treat", items: ["Headless Merchant", "Bat Trait", "Puppetmaster — $177.5M/s", "Scarino Crowino — $135M/s", "Scorpi Inferni — $76M/s", "Jacko Jakat — $41M/s", "Spooky Kart — $13M/s"] },
  { n: 72, date: "2026-10-24", title: "Grave Hunt / Dig Event", items: ["New dig event", "New Brainrots"] },
  { n: 71, date: "2026-10-17", title: "Hourly Skeleton Event", items: ["Normal, Dracula (25%) and Witch (5%) skeletons", "Skelly and Coffy — $155M/s", "Slushi Huski — Brainrot God, $322.5K/s", "Arca Bros — $250M/s (merch code)", "Medusini and Demonini — $180M/s"] },
  { n: 68, date: "2026-09-26", title: "Island Egg Event + 11 Brainrots", items: ["Island-hopping trampoline event", "Draculino — $120M/s", "Lionello Casarello — $58.5M/s", "Lavamanta — $28.5M/s"] },
  { n: 66, date: "2026-09-12", title: "OG Craft Machine Returns", items: ["Replaces RNG Machine", "Los Dragons — $425M/s", "Hippo Jacuzzo, Koala Parabala (Brainrot God)"] },
  { n: 65, date: "2026-09-05", title: "Money Money Puggy Ritual", items: ["Fuse two Money Money Puggies into Los Puggies — $40M/s", "1 of 1 base skin"] },
  { n: 14, date: "2025-08-30", title: "OG Rarity", items: ["Added OG rarity", "Strawberry Elephant"] },
    {
    n: 0,
    date: "2025-08-23",
    title: "Admin Abuse War",
    items: [
      "Jandel won the Admin Abuse War against Sammy.",
      "Grow a Garden reached approximately 23.3 million concurrent players, while Steal a Brainrot reached approximately 20.1 million."
    ]
  },
  { n: 10, date: "2025-08-01", title: "Fuse Machine", items: ["Added Fuse Machine"] },
  { n: 5, date: "2025-06-28", title: "Traits", items: ["Added Traits"] },
  { n: 1, date: "2025-05-31", title: "Mutations", items: ["Gold and Diamond mutations", "Secret rarity", "Rebirths 6 and 7"] },
];

export const SAMMY = {
  handle: "SpyderSammy",
  display: "Sammy",
  userId: "2678001507",
  facts: [
    "Display name “Sammy”, Roblox user ID 2678001507.",
    "Owner of the BRAZILIAN SPYDER group that publishes Steal a Brainrot.",
    "Chief Production Officer at Do Big Studios, which owns the game.",
    "Developing on Roblox since 2013.",
    "First original game: Crab Game (2022, Spyder Games group).",
    "Then Mining Clicker Simulator (Spyder Crew group).",
    "Lead developer on Blade Ball from late 2023.",
    "Released Pixel Tower Defense in 2024.",
    "Also credited on Race Clicker, Schedule and Fisch.",
    "Runs Admin Abuse live in servers: Saturdays after the update and Taco Tuesday.",
  ],
  gameFacts: [
    "Released May 16, 2025.",
    "Only Roblox game to pass 25 million concurrent players.",
    "Updates land almost every Saturday around 3 PM ET.",
    "Admin Abuse: Saturday after update, and Tuesdays 6 PM ET (Taco Tuesday).",
    "Available on PC, Mac, mobile, PlayStation and Xbox.",
  ],
};

/** Next weekly occurrence of a weekday/hour in America/New_York (approx. via fixed ET offset handling). */
export function nextET(weekday: number, hour: number, now = new Date()): Date {
  const etNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const offset = now.getTime() - etNow.getTime();
  const t = new Date(etNow);
  t.setHours(hour, 0, 0, 0);
  let add = (weekday - etNow.getDay() + 7) % 7;
  if (add === 0 && t <= etNow) add = 7;
  t.setDate(t.getDate() + add);
  return new Date(t.getTime() + offset);
}
