<script lang="ts">
  import { CalendarDays, MapPin } from "lucide-svelte";
  import { formatEventDate, formatEventPrice, getDeliveryModeLabel } from "@favcrm/sdk";

  let { event }: { event: any } = $props();

  const href = $derived(`/events/${event.slug}`);
  const image = $derived(event.imageUrl);
  const formattedDate = $derived(formatEventDate(event.dates));
  const formattedPrice = $derived(formatEventPrice(event));
  const deliveryLabel = $derived(getDeliveryModeLabel(event.deliveryMode));
</script>

<a class="event-card" {href}>
  <div class="event-card-media">
    {#if image}
      <img src={image} alt={event.title} loading="lazy" />
    {:else}
      <span class="image-fallback">
        <CalendarDays size={28} strokeWidth={1.4} />
      </span>
    {/if}
    <div class="event-card-flags">
      {#if deliveryLabel}
        <span class="event-card-flag event-card-flag--delivery">{deliveryLabel}</span>
      {/if}
      {#if event.status === 'ongoing'}
        <span class="event-card-flag event-card-flag--status">Ongoing</span>
      {/if}
    </div>
  </div>
  
  <div class="event-card-body">
    <h3 class="event-card-title">{event.title}</h3>
    
    <div class="event-card-meta">
      {#if formattedDate}
        <span class="event-card-meta-item">
          <CalendarDays size={14} strokeWidth={1.6} />
          {formattedDate}
        </span>
      {/if}
      {#if formattedDate && event.location}
        <span class="event-card-meta-dot" aria-hidden="true">·</span>
      {/if}
      {#if event.location}
        <span class="event-card-meta-item">
          <MapPin size={14} strokeWidth={1.6} />
          {event.location}
        </span>
      {/if}
    </div>

    <div class="event-card-footer">
      <div class="event-card-availability">
        {#if event.remainingQuota !== null && event.remainingQuota <= 5 && event.remainingQuota > 0}
          <span class="availability-low">Only {event.remainingQuota} left</span>
        {:else if event.remainingQuota === 0}
          <span class="availability-out">Sold Out</span>
        {:else}
          <span class="availability-ok">Available</span>
        {/if}
      </div>
      <span class="event-card-price">{formattedPrice}</span>
    </div>
  </div>
</a>

<style>
  .event-card {
    display: grid;
    grid-template-rows: auto 1fr;
    background: var(--surface, #fff);
    border: 1px solid var(--line, #e5e7eb);
    border-radius: var(--radius-card, 10px);
    overflow: hidden;
    color: inherit;
    text-decoration: none;
    transition: border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease;
  }
  .event-card:hover {
    border-color: var(--ink, #111);
    transform: translateY(-2px);
    box-shadow: 0 1px 0 rgb(17 17 17 / 4%), 0 12px 28px rgb(17 17 17 / 8%);
  }
  .event-card-media {
    position: relative;
    aspect-ratio: 4 / 3;
    background: #f3f4f6;
    overflow: hidden;
  }
  .event-card-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .event-card:hover .event-card-media img {
    transform: scale(1.04);
  }
  .event-card-media .image-fallback {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: var(--muted, #6b6b6b);
  }
  .event-card-flags {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    gap: 6px;
  }
  .event-card-flag {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .event-card-flag--delivery {
    background: rgba(255, 255, 255, 0.95);
    color: var(--ink, #111);
    backdrop-filter: blur(4px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  .event-card-flag--status {
    background: #10b981;
    color: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  .event-card-body {
    display: grid;
    gap: 8px;
    padding: clamp(16px, 1.8vw, 22px);
    align-content: start;
  }
  .event-card-title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 1.25rem;
    line-height: 1.25;
    letter-spacing: -0.01em;
    color: var(--ink, #111);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
  }
  .event-card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--ink-soft, #2a2a2a);
    margin-top: 4px;
  }
  .event-card-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .event-card-meta-dot {
    color: var(--muted, #6b6b6b);
  }
  .event-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    padding-top: 12px;
    border-top: 1px solid var(--line, #e5e7eb);
  }
  .event-card-availability {
    font-size: 12px;
    font-weight: 500;
  }
  .availability-low {
    color: #d97706; /* amber-600 */
  }
  .availability-out {
    color: #dc2626; /* red-600 */
  }
  .availability-ok {
    color: var(--muted, #6b6b6b);
  }
  .event-card-price {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 0.95rem;
    color: var(--ink, #111);
  }
</style>
