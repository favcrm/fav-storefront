<script lang="ts">
  import { CalendarDays } from "lucide-svelte";
  import { formatMoney } from "$lib/format";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<section class="page-shell">
  <div class="section-heading">
    <p class="eyebrow">Bookings</p>
    <h1>Services</h1>
  </div>
  <div class="listing-grid">
    {#each data.services as service}
      <article class="listing-card">
        <CalendarDays size={22} />
        <h2>{service.name}</h2>
        <p>{service.description ?? "Book this service through FavCRM."}</p>
        <strong>{formatMoney(service.price)}</strong>
      </article>
    {:else}
      <p class="empty-state">No services are published yet.</p>
    {/each}
  </div>
</section>
