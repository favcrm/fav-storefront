import { createFavCRM } from "$lib/favcrm";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => {
  const sdk = createFavCRM(fetch);
  return {
    services: await sdk.bookings.listServices().catch(() => []),
  };
};
