<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<section class="page-shell">
  <div class="section-heading">
    <p class="eyebrow">Journal</p>
    <h1>Latest Posts</h1>
  </div>
  <div class="listing-grid">
    {#each data.posts as post}
      <article class="listing-card">
        <h2>{post.title}</h2>
        <p>{post.excerpt ?? "Read the latest from this storefront."}</p>
      </article>
    {:else}
      <p class="empty-state">No posts are published yet.</p>
    {/each}
  </div>
</section>
