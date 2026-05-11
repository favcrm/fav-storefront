<script lang="ts">
  import { CalendarDays } from "lucide-svelte";
  import type { BlogPostListItem } from "@favcrm/sdk";

  let { post }: { post: BlogPostListItem } = $props();

  const href = $derived(`/blog/${post.slug}`);
  const image = $derived(post.featuredImage);
  const formattedDate = $derived(
    post.publishedAt 
      ? new Date(post.publishedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        })
      : ""
  );
</script>

<a class="blog-card" {href}>
  <div class="blog-card-media">
    {#if image}
      <img src={image} alt={post.title} loading="lazy" />
    {:else}
      <span class="image-fallback">
        <CalendarDays size={28} strokeWidth={1.4} />
      </span>
    {/if}
  </div>
  
  <div class="blog-card-body">
    <div class="blog-card-meta">
      {#if post.categories?.length}
        <span class="blog-card-category">{post.categories[0].name}</span>
      {/if}
      {#if post.categories?.length && formattedDate}
        <span class="blog-card-meta-dot" aria-hidden="true">·</span>
      {/if}
      {#if formattedDate}
        <span class="blog-card-date">{formattedDate}</span>
      {/if}
    </div>
    
    <h3 class="blog-card-title">{post.title}</h3>
    
    {#if post.excerpt}
      <p class="blog-card-excerpt">{post.excerpt}</p>
    {/if}
    
    <div class="blog-card-footer">
      <span class="blog-card-cta">Read article →</span>
    </div>
  </div>
</a>

<style>
  .blog-card {
    display: grid;
    grid-template-rows: auto 1fr;
    background: var(--surface, #fff);
    border: 1px solid var(--line, #e5e7eb);
    border-radius: var(--radius-card, 10px);
    overflow: hidden;
    color: inherit;
    text-decoration: none;
    transition: border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease;
  }
  .blog-card:hover {
    border-color: var(--ink, #111);
    transform: translateY(-2px);
    box-shadow: 0 1px 0 rgb(17 17 17 / 4%), 0 12px 28px rgb(17 17 17 / 8%);
  }
  .blog-card-media {
    position: relative;
    aspect-ratio: 16 / 9;
    background: #f3f4f6;
    overflow: hidden;
  }
  .blog-card-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .blog-card:hover .blog-card-media img {
    transform: scale(1.04);
  }
  .blog-card-media .image-fallback {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: var(--muted, #6b6b6b);
  }
  .blog-card-body {
    display: grid;
    gap: 8px;
    padding: clamp(16px, 1.8vw, 22px);
    align-content: start;
  }
  .blog-card-category {
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent, #1e3a8a);
  }
  .blog-card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--muted, #6b6b6b);
    margin-bottom: 2px;
  }
  .blog-card-meta-dot {
    color: var(--line, #e5e7eb);
  }
  .blog-card-title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 1.25rem;
    line-height: 1.25;
    letter-spacing: -0.01em;
    color: var(--ink, #111);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
  }
  .blog-card-excerpt {
    margin: 0;
    color: var(--muted, #6b6b6b);
    font-size: 0.9rem;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
  }
  .blog-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    padding-top: 12px;
    border-top: 1px solid var(--line, #e5e7eb);
  }
  .blog-card-cta {
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink, #111);
    transition: transform 160ms ease;
  }
  .blog-card:hover .blog-card-cta {
    transform: translateX(2px);
  }
</style>
