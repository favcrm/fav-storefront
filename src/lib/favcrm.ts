import { FavCRM } from "@favcrm/sdk";
import { get } from "svelte/store";
import { browser } from "$app/environment";
import { page } from "$app/stores";
import { requireStorefrontConfig, type ProviderContext } from "$lib/config";
import { logout } from "$lib/stores/auth";

/**
 * Construct an SDK client for the request's resolved workspace.
 *
 * `load` functions (server / universal) pass `ctx` explicitly — `fetch` so SDK
 * requests correlate with the render, and `companyId` resolved from the request
 * hostname via `await parent()` / `locals`.
 *
 * Client-side component calls may pass nothing: the hostname-resolved
 * `companyId` is then read from page data (exposed by `+layout.server.ts`).
 * The `VITE_FAVCRM_COMPANY_ID` env var is the final fallback.
 */
export function createFavCRM(ctx?: ProviderContext): FavCRM {
  const companyId =
    ctx?.companyId ??
    (browser ? (get(page).data.companyId as string | undefined) : undefined);
  const { apiUrl, companyId: resolved } = requireStorefrontConfig(companyId);

  return new FavCRM({
    baseUrl: apiUrl,
    companyId: resolved,
    fetch: ctx?.fetch,
    onUnauthorized: () => {
      if (browser) logout();
    },
  });
}
