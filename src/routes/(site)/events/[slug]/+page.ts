import { createFavCRM } from "$lib/favcrm";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, params, parent }) => {
  const { companyId } = await parent();
  const sdk = createFavCRM({ fetch, companyId });
  try {
    const event = await sdk.events.get(params.slug);
    return { event };
  } catch (_err) {
    throw error(404, "Event not found");
  }
};
