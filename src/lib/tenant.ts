import type { AnalyticsConfig, FeatureKey } from "@favcrm/sdk";
import { modulesToFeatures } from "@favcrm/sdk";
import { requireStorefrontConfig } from "$lib/config";
import { unwrapApiResponse } from "$lib/api-envelope";

export interface TenantConfig {
  companyId: string;
  modules: string[];
  features: FeatureKey[];
  brandName: string;
  brandEmail: string;
  brandLogoUrl: string | null;
  analyticsConfig: AnalyticsConfig | null;
}

interface CacheEntry {
  config: TenantConfig;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;

export async function fetchTenantConfig(
  fetchFn: typeof globalThis.fetch,
): Promise<TenantConfig> {
  const { apiUrl, companyId } = requireStorefrontConfig();
  const cached = cache.get(companyId);
  if (cached && cached.expiresAt > Date.now()) return cached.config;

  const res = await fetchFn(`${apiUrl}/v6/customer-portal/company/modules`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Company-Id": companyId,
    },
  });

  if (!res.ok) {
    throw new Error(`Tenant config request failed: ${res.status}`);
  }

  const data = unwrapApiResponse<Record<string, unknown>>(await res.json());
  const modules = Array.isArray(data.modules)
    ? (data.modules as { code?: string }[])
        .map((module) => module.code)
        .filter((code): code is string => Boolean(code))
    : [];

  const rawAnalytics = data.analyticsConfig as
    | AnalyticsConfig
    | null
    | undefined;
  const config: TenantConfig = {
    companyId,
    modules,
    features: Array.from(modulesToFeatures(modules)),
    brandName: String(data.brandName ?? data.name ?? "FavCRM Storefront"),
    brandEmail: String(data.brandEmail ?? data.email ?? ""),
    brandLogoUrl: (data.brandLogoUrl ?? data.logoUrl ?? null) as string | null,
    analyticsConfig: rawAnalytics ?? null,
  };

  cache.set(companyId, { config, expiresAt: Date.now() + TTL_MS });
  return config;
}
