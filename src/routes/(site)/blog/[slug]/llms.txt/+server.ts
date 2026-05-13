import { error } from "@sveltejs/kit";
import { createFavCRM } from "$lib/favcrm";
import type { RequestHandler } from "./$types";
import { editorjsToMarkdown } from "$lib/utils/markdown";

export const GET: RequestHandler = async ({ params, fetch, url }) => {
  const sdk = createFavCRM(fetch);
  try {
    const post = await sdk.blog.getBySlug(params.slug);
    if (!post) throw error(404, "Post not found");

    const mdContent = editorjsToMarkdown(post.blocks || "");
    const dateStr = post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString()
      : new Date(post.createdAt).toLocaleDateString();

    const markdown = `# ${post.title}

*Published: ${dateStr}*
*Original URL: ${url.origin}/blog/${post.slug}*

---

${mdContent}
`;

    return new Response(markdown, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("Failed to generate llms.txt for post", params.slug, e);
    throw error(404, "Post not found");
  }
};
