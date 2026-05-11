<script lang="ts">
  import { CalendarDays, MapPin } from "lucide-svelte";
  import { formatEventDate, formatEventPrice, getDeliveryModeLabel } from "@favcrm/sdk";

  let { event }: { event: any } = $props();

  const formattedDate = $derived(formatEventDate(event.dates));
  const formattedPrice = $derived(formatEventPrice(event));
  const deliveryLabel = $derived(getDeliveryModeLabel(event.deliveryMode));
</script>

<a href="/events/{event.slug}" class="listing-card group" style="text-decoration: none;">
  <div class="relative w-full aspect-[4/3] overflow-hidden rounded-t-lg -mx-[28px] -mt-[28px] mb-2 bg-[#f1efe9]">
    {#if event.imageUrl}
      <img src={event.imageUrl} alt={event.title} class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
    {:else}
      <div class="w-full h-full flex items-center justify-center text-gray-400">
        <CalendarDays size={32} opacity={0.5} />
      </div>
    {/if}
    <div class="absolute top-3 left-3 flex gap-2">
      {#if deliveryLabel}
        <span class="px-2.5 py-1 text-xs font-semibold bg-white/90 backdrop-blur text-gray-900 rounded-md shadow-sm">
          {deliveryLabel}
        </span>
      {/if}
      {#if event.status === 'ongoing'}
        <span class="px-2.5 py-1 text-xs font-semibold bg-emerald-500 text-white rounded-md shadow-sm">
          Ongoing
        </span>
      {/if}
    </div>
  </div>

  <div class="flex flex-col gap-3">
    <h2 class="listing-title text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">{event.title}</h2>
    
    <div class="flex flex-col gap-2 text-sm text-gray-600">
      {#if formattedDate}
        <div class="flex items-center gap-2">
          <CalendarDays size={14} class="opacity-70 flex-shrink-0" />
          <span class="line-clamp-1">{formattedDate}</span>
        </div>
      {/if}
      {#if event.location}
        <div class="flex items-center gap-2">
          <MapPin size={14} class="opacity-70 flex-shrink-0" />
          <span class="line-clamp-1">{event.location}</span>
        </div>
      {/if}
    </div>

    <div class="listing-meta mt-2 pt-4 border-t border-gray-100 flex justify-between items-center">
      <span class="text-sm font-medium text-gray-500">
        {#if event.remainingQuota !== null && event.remainingQuota <= 5 && event.remainingQuota > 0}
          <span class="text-amber-600">Only {event.remainingQuota} left</span>
        {:else if event.remainingQuota === 0}
          <span class="text-red-600 font-semibold">Sold Out</span>
        {:else}
          Tickets Available
        {/if}
      </span>
      <span class="listing-price font-bold text-gray-900 text-base">{formattedPrice}</span>
    </div>
  </div>
</a>
