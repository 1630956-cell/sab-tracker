import { existsFor } from "@/lib/mutation-exists";

/** Additional per-mutation exist counts provided for rare units. */
const ADDITIONAL_MUTATION_EXISTS: Record<string, Record<string, number>> = {
  strawberryelephant: { Gold: 187, Diamond: 93, Rainbow: 28, "Yin Yang": 19, Galaxy: 14, Candy: 9, Lava: 7, Radioactive: 7, Bloodrot: 5, Cyber: 2, Divine: 2, Crystal: 1, Phantom: 1 },
  meowl: { Gold: 323, Diamond: 161, Rainbow: 48, "Yin Yang": 32, Galaxy: 24, Candy: 16, Lava: 12, Radioactive: 12, Bloodrot: 8, Cyber: 4, Divine: 3, Crystal: 2, Phantom: 2 },
  bumbatron: { Gold: 398, Diamond: 199, Rainbow: 60, "Yin Yang": 40, Galaxy: 30, Candy: 20, Lava: 15, Radioactive: 15, Bloodrot: 10, Cyber: 5, Divine: 4, Crystal: 2, Phantom: 2 },
  fortunuandcashuru: { Gold: 697, Diamond: 349, Rainbow: 105, "Yin Yang": 70, Galaxy: 52, Candy: 35, Lava: 26, Radioactive: 26, Bloodrot: 17, Cyber: 9, Divine: 7, Crystal: 4, Phantom: 4 },
  noomyexamen: { Gold: 1067, Diamond: 534, Rainbow: 160, "Yin Yang": 107, Galaxy: 80, Candy: 53, Lava: 40, Radioactive: 40, Bloodrot: 27, Cyber: 13, Divine: 11, Crystal: 7, Phantom: 7 },
  pandapopanda: { Gold: 1188, Diamond: 594, Rainbow: 178, "Yin Yang": 119, Galaxy: 89, Candy: 59, Lava: 45, Radioactive: 45, Bloodrot: 30, Cyber: 15, Divine: 12, Crystal: 7, Phantom: 7 },
  foxinilanterini: { Gold: 1592, Diamond: 796, Rainbow: 239, "Yin Yang": 159, Galaxy: 119, Candy: 80, Lava: 60, Radioactive: 60, Bloodrot: 40, Cyber: 20, Divine: 16, Crystal: 10, Phantom: 10 },
  celularciniviciosini: { Gold: 3051, Diamond: 1526, Rainbow: 458, "Yin Yang": 305, Galaxy: 229, Candy: 153, Lava: 114, Radioactive: 114, Bloodrot: 76, Cyber: 38, Divine: 31, Crystal: 19, Phantom: 19 },
  scorpinocoasterino: { Gold: 3518, Diamond: 1759, Rainbow: 528, "Yin Yang": 352, Galaxy: 264, Candy: 176, Lava: 132, Radioactive: 132, Bloodrot: 88, Cyber: 44, Divine: 35, Crystal: 22, Phantom: 22 },
  losnoobinis: { Gold: 627544, Diamond: 313772, Rainbow: 94132, "Yin Yang": 62754, Galaxy: 47066, Candy: 31377, Lava: 23533, Radioactive: 23533, Bloodrot: 15689, Cyber: 7844, Divine: 6275, Crystal: 3922, Phantom: 3922 },
  cocofantoelefanto: { Gold: 2637625, Diamond: 1318813, Rainbow: 395644, "Yin Yang": 263763, Galaxy: 197822, Candy: 131881, Lava: 98911, Radioactive: 98911, Bloodrot: 65941, Cyber: 32970, Divine: 26376, Crystal: 16485, Phantom: 16485 },
};

/** Resolve supplied counts first, then fall back to the main published-count table. */
export function existsForWithAdditional(unitName: string, mutation: string): number | null {
  const key = unitName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const additional = ADDITIONAL_MUTATION_EXISTS[key]?.[mutation];
  return typeof additional === "number" ? additional : existsFor(unitName, mutation);
}
