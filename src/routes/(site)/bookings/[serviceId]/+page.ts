import { error } from "@sveltejs/kit";
import { createFavCRM } from "$lib/favcrm";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, params }) => {
  const sdk = createFavCRM(fetch);

  const [service, allServices] = await Promise.all([
    sdk.bookings.getService(params.serviceId).catch(() => null),
    sdk.bookings.listServices().catch(() => []),
  ]);

  if (!service) throw error(404, "Service not found");

  const related = allServices.filter((s) => s.id !== service.id).slice(0, 3);

  return { service, related };
};
