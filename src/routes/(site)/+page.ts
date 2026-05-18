import { createFavCRM } from "$lib/favcrm";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, parent }) => {
  const { companyId } = await parent();
  const sdk = createFavCRM({ fetch, companyId });
  const [products, posts] = await Promise.all([
    sdk.shop.listProducts({ limit: 4 }).catch(() => []),
    sdk.blog.list({ limit: 3 }).catch(() => null),
  ]);

  return {
    products,
    posts: posts?.items ?? [],
  };
};
