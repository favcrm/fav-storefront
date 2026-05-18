import { error } from "@sveltejs/kit";
import { fetchTenantConfig } from "$lib/tenant";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ fetch, parent }) => {
  const { companyId } = await parent();
  try {
    const tenant = await fetchTenantConfig(fetch, companyId);
    return { tenant };
  } catch (err) {
    console.error(err);
    throw error(500, "FavCRM storefront is not configured");
  }
};
