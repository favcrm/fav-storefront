import { error } from "@sveltejs/kit";
import { fetchTenantConfig } from "$lib/tenant";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ fetch }) => {
  try {
    const tenant = await fetchTenantConfig(fetch);
    return { tenant };
  } catch (err) {
    console.error(err);
    throw error(500, "FavCRM storefront is not configured");
  }
};
