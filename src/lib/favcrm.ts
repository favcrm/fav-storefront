import { FavCRM } from "@favcrm/sdk";
import { browser } from "$app/environment";
import { requireStorefrontConfig } from "$lib/config";
import { logout } from "$lib/stores/auth";

export function createFavCRM(fetchFn?: typeof globalThis.fetch): FavCRM {
  const { apiUrl, companyId } = requireStorefrontConfig();

  return new FavCRM({
    baseUrl: apiUrl,
    companyId,
    fetch: fetchFn,
    onUnauthorized: () => {
      if (browser) logout();
    },
  });
}
