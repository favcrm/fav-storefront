<script lang="ts">
  import { CalendarDays } from "lucide-svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<section class="page-shell">
  <div class="section-heading">
    <p class="eyebrow">Events</p>
    <h1>Upcoming Events</h1>
  </div>
  <div class="listing-grid">
    {#each data.events as event}
      <article class="listing-card">
        <CalendarDays size={22} />
        <h2>{event.title}</h2>
        <p>{event.introduction ?? event.content ?? "Event details are available soon."}</p>
      </article>
    {:else}
      <p class="empty-state">No events are published yet.</p>
    {/each}
  </div>
</section>
