<script lang="ts">
  import { ArrowLeft, CalendarDays } from "lucide-svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const post = $derived(data.post);
  
  const formattedDate = $derived(
    post.publishedAt 
      ? new Date(post.publishedAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric"
        })
      : ""
  );

  // Parse EditorJS blocks or similar structure
  let blocks = $derived.by(() => {
    if (!post.blocks) return [];
    try {
      const parsed = JSON.parse(post.blocks);
      if (Array.isArray(parsed)) return parsed;
      if (parsed.blocks && Array.isArray(parsed.blocks)) return parsed.blocks;
      return [];
    } catch {
      return []; // Could be plain HTML, but assuming EditorJS JSON for now based on FavCRM standard
    }
  });

  // Simple fallback if blocks are actually plain HTML (which sometimes happens)
  let isPlainHtml = $derived.by(() => {
    if (!post.blocks) return false;
    return post.blocks.trim().startsWith('<') && !post.blocks.trim().startsWith('{"');
  });
</script>

<svelte:head>
  <title>{post.seoTitle || post.title}</title>
  {#if post.seoDescription || post.excerpt}
    <meta name="description" content={post.seoDescription || post.excerpt} />
  {/if}
</svelte:head>

<article class="blog-post">
  <div class="site-container post-header">
    <a href="/blog" class="back-link">
      <ArrowLeft size={16} strokeWidth={2} />
      Back to Journal
    </a>
    
    {#if post.categories?.length}
      <span class="post-category">{post.categories[0].name}</span>
    {/if}
    
    <h1 class="site-h1 post-title">{post.title}</h1>
    
    {#if post.excerpt}
      <p class="post-excerpt">{post.excerpt}</p>
    {/if}
    
    <div class="post-meta">
      {#if formattedDate}
        <span class="meta-item">
          <CalendarDays size={16} strokeWidth={1.5} />
          {formattedDate}
        </span>
      {/if}
    </div>
  </div>

  {#if post.featuredImage}
    <div class="site-container post-hero-image">
      <img src={post.featuredImage} alt={post.title} />
    </div>
  {/if}

  <div class="site-container post-content">
    {#if isPlainHtml}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html post.blocks}
    {:else}
      {#each blocks as block}
        {#if block.type === 'paragraph'}
          <p><!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html block.data.html || block.data.text}</p>
        {:else if block.type === 'header'}
          {#if block.data.level === 1}
            <h1><!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html block.data.html || block.data.text}</h1>
          {:else if block.data.level === 2}
            <h2><!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html block.data.html || block.data.text}</h2>
          {:else if block.data.level === 3}
            <h3><!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html block.data.html || block.data.text}</h3>
          {:else if block.data.level === 4}
            <h4><!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html block.data.html || block.data.text}</h4>
          {:else}
            <h5><!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html block.data.html || block.data.text}</h5>
          {/if}
        {:else if block.type === 'list'}
          {#if block.data.style === 'ordered'}
            <ol>
              {#each block.data.items as item}
                <li><!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html item}</li>
              {/each}
            </ol>
          {:else}
            <ul>
              {#each block.data.items as item}
                <li><!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html item}</li>
              {/each}
            </ul>
          {/if}
        {:else if block.type === 'image'}
          <figure>
            <img src={block.data.file?.url || block.data.url} alt={block.data.caption || ""} />
            {#if block.data.caption}
              <figcaption><!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html block.data.caption}</figcaption>
            {/if}
          </figure>
        {:else if block.type === 'quote'}
          <blockquote>
            <p><!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html block.data.html || block.data.text}</p>
            {#if block.data.caption}
              <cite><!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html block.data.caption}</cite>
            {/if}
          </blockquote>
        {:else if block.type === 'delimiter'}
          <hr />
        {:else if block.type === 'code'}
          <pre><code>{block.data.code}</code></pre>
        {:else if block.type === 'raw'}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html block.data.html}
        {/if}
      {/each}
    {/if}
  </div>
</article>

<style>
  .blog-post {
    padding-bottom: clamp(60px, 8vw, 120px);
  }
  .post-header {
    max-width: 800px;
    padding-top: clamp(40px, 6vw, 80px);
    padding-bottom: clamp(32px, 5vw, 64px);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--muted, #6b6b6b);
    text-decoration: none;
    margin-bottom: clamp(24px, 4vw, 40px);
    transition: color 200ms ease;
  }
  .back-link:hover {
    color: var(--ink, #111);
  }
  .post-category {
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent, #1e3a8a);
    margin-bottom: 16px;
  }
  .post-title {
    margin: 0 0 16px;
    font-size: clamp(2.25rem, 5vw, 4rem);
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  .post-excerpt {
    font-size: clamp(1.125rem, 2vw, 1.35rem);
    line-height: 1.5;
    color: var(--muted, #6b6b6b);
    margin: 0 0 24px;
    max-width: 680px;
  }
  .post-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    color: var(--muted, #6b6b6b);
    font-size: 0.9rem;
    border-top: 1px solid var(--line, #e5e7eb);
    padding-top: 24px;
    width: 100%;
  }
  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .post-hero-image {
    max-width: 1000px;
    margin-bottom: clamp(40px, 6vw, 80px);
  }
  .post-hero-image img {
    width: 100%;
    height: auto;
    max-height: 60vh;
    object-fit: cover;
    border-radius: var(--radius-card, 10px);
    background: #f3f4f6;
  }

  .post-content {
    max-width: 720px;
    font-size: 1.125rem;
    line-height: 1.7;
    color: var(--ink, #111);
  }
  
  /* Typography for the article body */
  .post-content :global(p) {
    margin: 0 0 1.5em;
  }
  .post-content :global(h1),
  .post-content :global(h2),
  .post-content :global(h3),
  .post-content :global(h4) {
    font-family: var(--font-display);
    font-weight: 500;
    color: var(--ink, #111);
    margin: 2em 0 0.8em;
    line-height: 1.25;
    letter-spacing: -0.01em;
  }
  .post-content :global(h1) { font-size: 2.25rem; }
  .post-content :global(h2) { font-size: 1.875rem; }
  .post-content :global(h3) { font-size: 1.5rem; }
  .post-content :global(ul),
  .post-content :global(ol) {
    margin: 0 0 1.5em;
    padding-left: 1.5em;
  }
  .post-content :global(li) {
    margin-bottom: 0.5em;
  }
  .post-content :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 2em 0;
  }
  .post-content :global(figure) {
    margin: 2em 0;
  }
  .post-content :global(figcaption) {
    font-size: 0.85rem;
    color: var(--muted, #6b6b6b);
    text-align: center;
    margin-top: 0.8em;
  }
  .post-content :global(blockquote) {
    margin: 2em 0;
    padding: 1.5em 2em;
    border-left: 3px solid var(--ink, #111);
    background: #f9fafb;
    font-style: italic;
    font-size: 1.25rem;
  }
  .post-content :global(blockquote p) {
    margin: 0;
  }
  .post-content :global(blockquote cite) {
    display: block;
    margin-top: 1em;
    font-size: 0.9rem;
    font-style: normal;
    color: var(--muted, #6b6b6b);
  }
  .post-content :global(pre) {
    background: #111;
    color: #fff;
    padding: 1.5em;
    border-radius: 8px;
    overflow-x: auto;
    margin: 2em 0;
    font-family: var(--font-mono);
    font-size: 0.9rem;
  }
  .post-content :global(code) {
    font-family: var(--font-mono);
    font-size: 0.9em;
    background: #f3f4f6;
    padding: 0.2em 0.4em;
    border-radius: 4px;
  }
  .post-content :global(pre code) {
    background: none;
    padding: 0;
    border-radius: 0;
  }
  .post-content :global(hr) {
    border: none;
    border-top: 1px solid var(--line, #e5e7eb);
    margin: 3em 0;
  }
  .post-content :global(a) {
    color: var(--accent, #1e3a8a);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }
</style>
