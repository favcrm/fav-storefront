<script lang="ts">
  import { CalendarDays, Clock, Users } from "lucide-svelte";
  import type { BookingService } from "@favcrm/sdk";
  import { formatMoney } from "$lib/format";

  let { service }: { service: BookingService } = $props();

  const href = $derived(`/bookings/${service.id}`);
  const image = $derived(service.coverImage);
  const priceLabel = $derived(
    service.displayPrice ?? formatMoney(Number(service.price) || 0),
  );
  const duration = $derived(formatDuration(service.durationMinutes));
  const capacityLabel = $derived(
    service.capacity > 1 ? `Up to ${service.capacity}` : "1:1",
  );

  function formatDuration(mins: number): string {
    if (mins <= 0) return "—";
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
  }
</script>

<a class="service-card" {href}>
  <div class="service-card-media">
    {#if image}
      <img src={image} alt={service.name} loading="lazy" />
    {:else}
      <span class="image-fallback">
        <CalendarDays size={28} strokeWidth={1.4} />
      </span>
    {/if}
    {#if service.requiresConfirmation}
      <span class="service-card-flag">Confirmation required</span>
    {/if}
  </div>
  <div class="service-card-body">
    {#if service.categoryName}
      <span class="service-card-category">{service.categoryName}</span>
    {/if}
    <h3 class="service-card-title">{service.name}</h3>
    {#if service.description}
      <p class="service-card-description">{service.description}</p>
    {/if}
    <div class="service-card-meta">
      <span class="service-card-meta-item">
        <Clock size={14} strokeWidth={1.6} />
        {duration}
      </span>
      <span class="service-card-meta-dot" aria-hidden="true">·</span>
      <span class="service-card-meta-item">
        <Users size={14} strokeWidth={1.6} />
        {capacityLabel}
      </span>
    </div>
    <div class="service-card-footer">
      <span class="service-card-price">{priceLabel}</span>
      <span class="service-card-cta">Book →</span>
    </div>
  </div>
</a>

<style>
  .service-card {
    display: grid;
    grid-template-rows: auto 1fr;
    background: var(--surface, #fff);
    border: 1px solid var(--line, #e5e7eb);
    border-radius: var(--radius-card, 10px);
    overflow: hidden;
    color: inherit;
    text-decoration: none;
    transition: border-color 200ms ease, transform 200ms ease,
      box-shadow 200ms ease;
  }
  .service-card:hover {
    border-color: var(--ink, #111);
    transform: translateY(-2px);
    box-shadow: 0 1px 0 rgb(17 17 17 / 4%), 0 12px 28px rgb(17 17 17 / 8%);
  }
  .service-card-media {
    position: relative;
    aspect-ratio: 4 / 3;
    background: #f3f4f6;
    overflow: hidden;
  }
  .service-card-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .service-card:hover .service-card-media img {
    transform: scale(1.04);
  }
  .service-card-media .image-fallback {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: var(--muted, #6b6b6b);
  }
  .service-card-flag {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 4px 8px;
    background: rgba(17, 17, 17, 0.88);
    color: var(--paper, #ffffff);
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .service-card-body {
    display: grid;
    gap: 8px;
    padding: clamp(16px, 1.8vw, 22px);
    align-content: start;
  }
  .service-card-category {
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent, #1e3a8a);
  }
  .service-card-title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 1.25rem;
    line-height: 1.25;
    letter-spacing: -0.01em;
    color: var(--ink, #111);
  }
  .service-card-description {
    margin: 0;
    color: var(--muted, #6b6b6b);
    font-size: 0.9rem;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
  }
  .service-card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--ink-soft, #2a2a2a);
    margin-top: 4px;
  }
  .service-card-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .service-card-meta-dot {
    color: var(--muted, #6b6b6b);
  }
  .service-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    padding-top: 12px;
    border-top: 1px solid var(--line, #e5e7eb);
  }
  .service-card-price {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 0.95rem;
    color: var(--ink, #111);
  }
  .service-card-cta {
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink, #111);
    transition: transform 160ms ease;
  }
  .service-card:hover .service-card-cta {
    transform: translateX(2px);
  }
</style>
