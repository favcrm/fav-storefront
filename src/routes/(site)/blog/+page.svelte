<script lang="ts">
  import { Newspaper } from "lucide-svelte";
  import PageHeader from "$lib/components/site/PageHeader.svelte";
  import ListingCard from "$lib/components/site/ListingCard.svelte";
  import EmptyState from "$lib/components/site/EmptyState.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<PageHeader
  eyebrow="Journal"
  title="Latest posts"
  lead="Notes, updates, and stories from the team."
/>

<section class="site-container site-section site-section--tight">
  {#if data.posts.length}
    <div class="listing-grid">
      {#each data.posts as post}
        <ListingCard
          title={post.title}
          description={post.excerpt ??
            "Read the latest from this storefront."}
        />
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
