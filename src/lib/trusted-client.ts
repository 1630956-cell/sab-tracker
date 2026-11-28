/**
 * Only use a client IP header when deployment explicitly confirms a trusted
 * Cloudflare proxy sits in front of the app. Forwarded headers are user-spoofable
 * on direct-origin deployments.
 */
export function getTrustedClientKey(cfConnectingIp: string | undefined, trustCloudflareProxy: boolean): string | null {
  if (!trustCloudflareProxy || !cfConnectingIp) return null;
  const value = cfConnectingIp.trim();
  if (!value || value.length > 64 || /[\s,]/.test(value)) return null;
  // Conservative syntax check; the trusted proxy is responsible for the actual IP.
  if (!/^[0-9a-fA-F:.]+$/.test(value)) return null;
  return value;
}
