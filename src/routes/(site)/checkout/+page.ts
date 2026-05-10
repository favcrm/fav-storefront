import { error } from "@sveltejs/kit";
import { createFavCRM } from "$lib/favcrm";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => {
  const client = createFavCRM(fetch);
  try {
    const [shipping, payment] = await Promise.all([
      client.shop.listShippingMethods(),
      client.shop.listPaymentMethods(),
    ]);
    return { shipping, payment };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load checkout";
    throw error(500, message);
  }
};
