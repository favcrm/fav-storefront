<script lang="ts">
  import { Newspaper } from "lucide-svelte";
  import PageHeader from "$lib/components/site/PageHeader.svelte";
  import BlogCard from "$lib/components/site/BlogCard.svelte";
  import EmptyState from "$lib/components/site/EmptyState.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Journal</title>
</svelte:head>

<PageHeader
  eyebrow="Journal"
  title="Latest posts"
  lead="Notes, updates, and stories from the team."
/>

<section class="site-container site-section site-section--tight">
  {#if data.posts.length}
    <div class="blog-grid">
      {#each data.posts as post}
        <BlogCard {post} />
      {/each}
    </div>
  {:else}
    <EmptyState
      icon={Newspaper}
      title="No posts published"
      description="Write your first journal entry in FavCRM to publish it here."
    />
  {/if}
</section>

<style>
  .blog-grid {
    display: grid;
    gap: clamp(20px, 3vw, 32px);
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
</style>
