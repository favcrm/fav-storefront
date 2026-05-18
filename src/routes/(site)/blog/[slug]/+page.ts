import { error } from "@sveltejs/kit";
import { createFavCRM } from "$lib/favcrm";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch, parent }) => {
  const { companyId } = await parent();
  const sdk = createFavCRM({ fetch, companyId });
  try {
    const post = await sdk.blog.getBySlug(params.slug);
    if (!post) throw error(404, "Post not found");
    return { post };
  } catch {
    throw error(404, "Post not found");
  }
};
