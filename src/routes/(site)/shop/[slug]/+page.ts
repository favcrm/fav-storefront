import { error } from "@sveltejs/kit";
import { createFavCRM } from "$lib/favcrm";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, params }) => {
  const sdk = createFavCRM(fetch);

  try {
    const [product, related] = await Promise.all([
      sdk.shop.getProduct(params.slug),
      sdk.shop.getRelatedProducts(params.slug, 4).catch(() => []),
    ]);
    return { product, related };
  } catch {
    throw error(404, "Product not found");
  }
};
