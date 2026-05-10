import { createFavCRM } from "$lib/favcrm";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => {
  const sdk = createFavCRM(fetch);

  const [products, categories, services, events, blog] = await Promise.all([
    sdk.shop.listProducts({ limit: 6 }).catch(() => []),
    sdk.shop.listCategories().catch(() => []),
    sdk.bookings.listServices().catch(() => []),
    sdk.events.list().catch(() => []),
    sdk.blog.list({ limit: 4 }).catch(() => ({
      items: [],
      pagination: {
        page: 1,
        limit: 4,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    })),
  ]);

  return {
    products,
    categories,
    services,
    events,
    posts: blog.items,
    blogTotal: blog.pagination.total,
  };
};
