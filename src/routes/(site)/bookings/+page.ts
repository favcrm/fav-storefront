import { createFavCRM } from "$lib/favcrm";
import type { BookingService } from "@favcrm/sdk";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, url }) => {
  const sdk = createFavCRM(fetch);
  const services = await sdk.bookings.listServices().catch(() => []);

  const categories = uniqueCategories(services);
  const search = (url.searchParams.get("q") ?? "").trim();
  const category = (url.searchParams.get("category") ?? "").trim();

  const filtered = filterServices(services, { search, category });

  return { services: filtered, categories, search, category };
};

function uniqueCategories(services: BookingService[]): string[] {
  const set = new Set<string>();
  for (const service of services) {
    if (service.categoryName) set.add(service.categoryName);
  }
  return Array.from(set).sort();
}

function filterServices(
  services: BookingService[],
  { search, category }: { search: string; category: string },
): BookingService[] {
  const needle = search.toLowerCase();
  return services.filter((service) => {
    if (category && service.categoryName !== category) return false;
    if (!needle) return true;
    const haystack = `${service.name} ${service.description ?? ""}`.toLowerCase();
    return haystack.includes(needle);
  });
}
