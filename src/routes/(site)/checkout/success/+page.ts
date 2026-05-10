import { createFavCRM } from "$lib/favcrm";
import type { ShopOrder } from "@favcrm/sdk";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, url }) => {
  const orderUuid = url.searchParams.get("order");
  if (!orderUuid) {
    return { orderUuid: null, order: null, loadError: null };
  }
  try {
    const sdk = createFavCRM(fetch);
    const order = await sdk.shop.getOrder(orderUuid);
    return { orderUuid, order: order as ShopOrder, loadError: null };
  } catch (err) {
    return {
      orderUuid,
      order: null,
      loadError: err instanceof Error ? err.message : "Failed to load order",
    };
  }
};
