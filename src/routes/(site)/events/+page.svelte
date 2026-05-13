<script lang="ts">
  import { CalendarDays } from "lucide-svelte";
  import PageHeader from "$lib/components/site/PageHeader.svelte";
  import EventCard from "$lib/components/site/EventCard.svelte";
  import EmptyState from "$lib/components/site/EmptyState.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Events - Upcoming</title>
  <meta name="description" content="Discover our upcoming workshops, launches, and member-only gatherings. Register online." />
</svelte:head>

<PageHeader
  eyebrow="Events"
  title="Upcoming"
  lead="Workshops, launches, and member-only gatherings."
/>

<section class="site-container site-section site-section--tight">
  {#if data.events.length}
    <div class="event-grid">
      {#each data.events as event}
        <EventCard {event} />
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

<style>
  .event-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: clamp(18px, 2vw, 28px);
  }
</style>
