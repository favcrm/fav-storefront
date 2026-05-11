import { createFavCRM } from "$lib/favcrm";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, params }) => {
  const sdk = createFavCRM(fetch);
  try {
    const event = await sdk.events.get(params.slug);
    return { event };
  } catch (err) {
    throw error(404, "Event not found");
  }
};
