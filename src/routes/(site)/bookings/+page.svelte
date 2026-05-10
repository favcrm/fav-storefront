<script lang="ts">
  import { CalendarDays } from "lucide-svelte";
  import { formatMoney } from "$lib/format";
  import PageHeader from "$lib/components/site/PageHeader.svelte";
  import ListingCard from "$lib/components/site/ListingCard.svelte";
  import EmptyState from "$lib/components/site/EmptyState.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<PageHeader
  eyebrow="Bookings"
  title="Services"
  lead="Reserve a session with one of our specialists. Slots and resources are managed in FavCRM."
/>

<section class="site-container site-section site-section--tight">
  {#if data.services.length}
    <div class="listing-grid">
      {#each data.services as service}
        <ListingCard
          icon={CalendarDays}
          title={service.name}
          description={service.description ??
            "Book this service through your FavCRM workspace."}
          price={formatMoney(service.price)}
        />
      {/each}
    </div>
  {:else}
    <EmptyState
      icon={CalendarDays}
      title="No services published"
      description="Add bookable services in your FavCRM workspace to list them here."
    />
  {/if}
</section>
