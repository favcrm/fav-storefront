import { error } from "@sveltejs/kit";
import { createFavCRM } from "$lib/favcrm";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, params, parent }) => {
  const { companyId } = await parent();
  const sdk = createFavCRM({ fetch, companyId });
  const service = await sdk.bookings
    .getService(params.serviceId)
    .catch(() => null);

  if (!service) throw error(404, "Service not found");

  return { service };
};
