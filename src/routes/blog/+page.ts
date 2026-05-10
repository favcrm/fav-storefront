import { createFavCRM } from "$lib/favcrm";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => {
  const sdk = createFavCRM(fetch);
  const posts = await sdk.blog.list({ limit: 12 }).catch(() => null);
  return {
    posts: posts?.items ?? [],
  };
};
