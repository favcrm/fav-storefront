import { createFavCRM } from "$lib/favcrm";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, parent }) => {
  const { companyId } = await parent();
  const sdk = createFavCRM({ fetch, companyId });
  const posts = await sdk.blog.list({ limit: 12 }).catch(() => null);
  return {
    posts: posts?.items ?? [],
  };
};
