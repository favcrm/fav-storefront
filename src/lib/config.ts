/**
 * Runtime configuration.
 *
 * The storefront needs a FavCRM workspace (`companyId`). It is resolved two
 * ways, in priority order:
 *
 *   1. At request time from the deployment's own hostname — a `storefront_domains`
 *      row registered in FavCRM (see `hooks.server.ts`). Threaded into
 *      `createFavCRM` via `ProviderContext.companyId`.
 *   2. The `VITE_FAVCRM_COMPANY_ID` build-time env var — the fallback, mainly
 *      for local development.
 */
export const FAVCRM_API_URL =
  (import.meta.env.VITE_FAVCRM_API_URL as string | undefined)?.replace(
    /\/$/,
    "",
  ) ?? "https://api.favcrm.io";

/** Build-time workspace UUID fallback. `undefined` until resolved/configured. */
export const FAVCRM_COMPANY_ID = (
  import.meta.env.VITE_FAVCRM_COMPANY_ID as string | undefined
)?.trim();

export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ??
  "";

/**
 * Per-request context, threaded into `createFavCRM` by `load` functions.
 *
 * - `fetch` — the SvelteKit `event.fetch`, so SDK requests correlate with the
 *   render. Falls back to `globalThis.fetch` for client-side calls.
 * - `companyId` — the workspace resolved from the request hostname. Wins over
 *   the `VITE_FAVCRM_COMPANY_ID` env fallback.
 */
export type ProviderContext = {
  fetch?: typeof globalThis.fetch;
  companyId?: string;
};

/**
 * Resolve the effective workspace UUID for a request.
 * Hostname-resolved companyId wins; the env var is the fallback.
 */
export function resolveCompanyId(companyId?: string): string | undefined {
  return companyId?.trim() || FAVCRM_COMPANY_ID || undefined;
}

/**
 * Storefront config for a request. `companyId` is the hostname-resolved
 * workspace when available; the env var is the fallback. Throws when no
 * workspace can be resolved at all — the storefront cannot run without one.
 */
export function requireStorefrontConfig(companyId?: string) {
  const resolved = resolveCompanyId(companyId);
  if (!resolved) {
    throw new Error(
      "No FavCRM workspace — register this hostname in FavCRM or set VITE_FAVCRM_COMPANY_ID.",
    );
  }

  return {
    apiUrl: FAVCRM_API_URL,
    companyId: resolved,
    siteUrl: SITE_URL,
  };
}
