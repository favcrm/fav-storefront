<script lang="ts">
  import { CalendarDays } from "lucide-svelte";
  import PageHeader from "$lib/components/site/PageHeader.svelte";
  import ListingCard from "$lib/components/site/ListingCard.svelte";
  import EmptyState from "$lib/components/site/EmptyState.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<PageHeader
  eyebrow="Events"
  title="Upcoming"
  lead="Workshops, launches, and member-only gatherings."
/>

<section class="site-container site-section site-section--tight">
  {#if data.events.length}
    <div class="listing-grid">
      {#each data.events as event}
        <ListingCard
          icon={CalendarDays}
          title={event.title}
          description={event.introduction ??
            event.content ??
            "Event details are available soon."}
        />
      {/each}
    </div>
  {:else}
    <EmptyState
      icon={CalendarDays}
      title="No events scheduled"
      description="Publish events in FavCRM to highlight them on this page."
    />
  {/if}
</section>
