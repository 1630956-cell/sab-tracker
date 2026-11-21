/** Private server link helpers. Only real https Roblox links are accepted. */
export const PS_STORAGE_KEY = "brainrot-ps-link";

export function parsePsLink(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (host !== "roblox.com" && !host.endsWith(".roblox.com")) return null;
  const isShare = url.pathname.startsWith("/share") && !!url.searchParams.get("code");
  const isLinkCode = url.pathname.startsWith("/games/") && !!url.searchParams.get("privateServerLinkCode");
  if (!isShare && !isLinkCode) return null;
  url.protocol = "https:";
  return url.toString();
}
