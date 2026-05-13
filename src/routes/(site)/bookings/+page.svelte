<script lang="ts">
  import { CalendarDays, Search } from "lucide-svelte";
  import PageHeader from "$lib/components/site/PageHeader.svelte";
  import ServiceCard from "$lib/components/site/ServiceCard.svelte";
  import EmptyState from "$lib/components/site/EmptyState.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Services & Bookings</title>
  <meta name="description" content="Reserve a session with one of our specialists. Browse our available services and book online." />
</svelte:head>

<PageHeader
  eyebrow="Bookings"
  title="Services"
  lead="Reserve a session with one of our specialists. Slots and resources are managed in FavCRM."
/>

<section class="site-container site-section site-section--tight">
  <form class="toolbar" method="GET">
    <label>
      <Search size={16} strokeWidth={1.6} />
      <input name="q" placeholder="Search services" value={data.search ?? ""} />
    </label>
    <select name="category" aria-label="Category">
      <option value="">All categories</option>
      {#each data.categories as category}
        <option value={category} selected={data.category === category}>
          {category}
        </option>
      {/each}
    </select>
    <button class="btn-site btn-site--secondary" type="submit">Filter</button>
  </form>

  {#if data.services.length}
    <div class="service-grid">
      {#each data.services as service (service.id)}
        <ServiceCard {service} />
      {/each}
    </div>
  {:else}
    <EmptyState
      icon={CalendarDays}
      title={data.search || data.category
        ? "No matching services"
        : "No services published"}
      description={data.search || data.category
        ? "Try clearing the search or selecting a different category."
        : "Add bookable services in your FavCRM workspace to list them here."}
    />
  {/if}
</section>

<style>
  .service-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: clamp(18px, 2vw, 28px);
  }
</style>
