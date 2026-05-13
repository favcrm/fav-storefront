import { createFavCRM } from "$lib/favcrm";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ fetch, url }) => {
  const sdk = createFavCRM(fetch);
  const baseUrl = url.origin;

  let blogPosts: any[] = [];
  try {
    const postsResult = await sdk.blog.list({ limit: 15 });
    blogPosts = postsResult?.items ?? [];
  } catch (e) {
    console.error("Failed to fetch blog posts for llms.txt", e);
  }

  // Create standard llmstxt.org content
  let content = `# Storefront Directory

This is the agent-friendly directory for our site. You can find our latest content below.

## Recent Blog Posts
`;

  if (blogPosts.length > 0) {
    for (const post of blogPosts) {
      // Basic post list
      content += `- [${post.title}](${baseUrl}/blog/${post.slug})\n`;
      if (post.excerpt) {
        content += `  > ${post.excerpt}\n`;
      }
      content += `  Markdown view: ${baseUrl}/blog/${post.slug}/llms.txt\n\n`;
    }
  } else {
    content += `*No blog posts available at the moment.*\n`;
  }

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
