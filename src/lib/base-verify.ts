// Base Verify API Client
// Docs: https://github.com/base/base-verify-demo

const BASE_VERIFY_URL = process.env.BASE_VERIFY_API_URL || "https://api.base.org/verify/v1";

export interface VerifiableTrait {
  provider: "x" | "coinbase" | "instagram" | "tiktok";
  traits: string[];
}

export interface VerificationResult {
  verified: boolean;
  token: string | null;
  provider: string;
  traits: Record<string, string>;
  needsVerification?: boolean;
  error?: string;
}

export interface ProviderData {
  id: string;
  name: string;
  icon: string;
  availableTraits: { key: string; label: string }[];
}

export const PROVIDERS: Record<string, ProviderData> = {
  x: {
    id: "x",
    name: "X / Twitter",
    icon: "𝕏",
    availableTraits: [
      { key: "verified:eq:true", label: "Blue Checkmark" },
      { key: "followers:gte:1000", label: "1,000+ Followers" },
      { key: "followers:gte:10000", label: "10,000+ Followers" },
      { key: "followers:gte:100000", label: "100,000+ Followers" },
    ],
  },
  coinbase: {
    id: "coinbase",
    name: "Coinbase",
    icon: "C",
    availableTraits: [
      { key: "coinbase_one_active:eq:true", label: "Coinbase One Active" },
      { key: "coinbase_one_billed:eq:true", label: "Coinbase One Paid" },
    ],
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    icon: "IG",
    availableTraits: [
      { key: "followers_count:gte:1000", label: "1,000+ Followers" },
      { key: "followers_count:gte:10000", label: "10,000+ Followers" },
      { key: "followers_count:gte:100000", label: "100,000+ Followers" },
    ],
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    icon: "TT",
    availableTraits: [
      { key: "follower_count:gte:1000", label: "1,000+ Followers" },
      { key: "video_count:gte:50", label: "50+ Videos" },
      { key: "likes_count:gte:10000", label: "10,000+ Likes" },
    ],
  },
};

export function buildResourceUrns(providers: string[], traits?: string[]): string[] {
  const urns: string[] = [];
  for (const p of providers) {
    urns.push(`urn:verify:provider:${p}`);
  }
  if (traits) {
    for (const t of traits) {
      urns.push(`urn:verify:provider:${t}`);
    }
  }
  return urns;
}

export async function checkVerification(
  address: string,
  signature: string,
  message: string,
  providers: string[],
  traits: Record<string, string[]>
): Promise<VerificationResult[]> {
  const secretKey = process.env.BASE_VERIFY_SECRET_KEY;
  if (!secretKey) {
    return providers.map((p) => ({
      verified: false,
      token: null,
      provider: p,
      traits: {},
      error: "Base Verify API key not configured",
    }));
  }

  const results: VerificationResult[] = [];

  for (const provider of providers) {
    try {
      const providerTraits = traits[provider] || [];
      const payload = {
        address,
        signature,
        message,
        provider,
        traits: providerTraits,
      };

      const r = await fetch(`${BASE_VERIFY_URL}/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secretKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (r.status === 200) {
        const data = await r.json();
        results.push({
          verified: true,
          token: data.token || null,
          provider,
          traits: data.traits || {},
        });
      } else if (r.status === 404) {
        results.push({
          verified: false,
          token: null,
          provider,
          traits: {},
          needsVerification: true,
        });
      } else if (r.status === 400) {
        const data = await r.json();
        results.push({
          verified: false,
          token: null,
          provider,
          traits: data.traits || {},
          error: data.message || "Does not meet trait requirements",
        });
      } else {
        results.push({
          verified: false,
          token: null,
          provider,
          traits: {},
          error: `API error: ${r.status}`,
        });
      }
    } catch (e: any) {
      results.push({
        verified: false,
        token: null,
        provider,
        traits: {},
        error: e.message,
      });
    }
  }

  return results;
}
