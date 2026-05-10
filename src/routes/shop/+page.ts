import { createFavCRM } from "$lib/favcrm";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, url }) => {
  const sdk = createFavCRM(fetch);
  const search = url.searchParams.get("q") ?? undefined;
  const category_slug = url.searchParams.get("category") ?? undefined;

  const [products, categories] = await Promise.all([
    sdk.shop.listProducts({ search, category_slug, limit: 48 }),
    sdk.shop.listCategories().catch(() => []),
  ]);

  return { products, categories, search, category_slug };
};
