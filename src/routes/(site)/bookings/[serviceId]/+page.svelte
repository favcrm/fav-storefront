<script lang="ts">
  import {
    ArrowLeft,
    CalendarDays,
    Clock,
    Lock,
    Users,
  } from "lucide-svelte";
  import { formatMoney } from "$lib/format";
  import Button from "$lib/components/site/Button.svelte";
  import Eyebrow from "$lib/components/site/Eyebrow.svelte";
  import ServiceCard from "$lib/components/site/ServiceCard.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const service = $derived(data.service);
  const priceLabel = $derived(
    service.displayPrice ?? formatMoney(Number(service.price) || 0),
  );
  const duration = $derived(formatDuration(service.durationMinutes));
  const capacityLabel = $derived(
    service.capacity > 1 ? `Up to ${service.capacity}` : "1:1 session",
  );

  function formatDuration(mins: number): string {
    if (mins <= 0) return "—";
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
  }

  let schemaOrg = $derived({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.name,
    "description": service.description || undefined,
    "provider": {
      "@type": "LocalBusiness",
      "name": "Storefront"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "USD", // Adjust if dynamic
      "price": typeof service.price === 'number' ? (service.price / 100).toFixed(2) : undefined
    }
  });
</script>

<svelte:head>
  <title>{service.name}</title>
  {#if service.description}
    <meta name="description" content={service.description} />
  {/if}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html `<script type="application/ld+json">${JSON.stringify(schemaOrg)}</script>`}
</svelte:head>

<section class="site-container service-detail">
  <a class="back-link" href="/bookings">
    <ArrowLeft size={14} strokeWidth={1.7} />
    All services
  </a>

  <div class="service-detail-grid">
    <div class="service-detail-media">
      {#if service.coverImage}
        <img src={service.coverImage} alt={service.name} />
      {:else}
        <span class="image-fallback">
          <CalendarDays size={36} strokeWidth={1.3} />
        </span>
      {/if}
    </div>

    <div class="service-detail-copy">
      {#if service.categoryName}
        <Eyebrow>{service.categoryName}</Eyebrow>
      {:else}
        <Eyebrow>Service</Eyebrow>
      {/if}
      <h1 class="site-h1">{service.name}</h1>
      <p class="price">{priceLabel}</p>

      <div class="service-meta">
        <span class="service-meta-item">
          <Clock size={14} strokeWidth={1.6} />
          {duration}
        </span>
        <span class="service-meta-item">
          <Users size={14} strokeWidth={1.6} />
          {capacityLabel}
        </span>
        {#if service.requiresConfirmation}
          <span class="service-meta-tag">Confirmation required</span>
        {/if}
        {#if service.requireLogin}
          <span class="service-meta-tag service-meta-tag--lock">
            <Lock size={11} strokeWidth={1.8} />
            Members only
          </span>
        {/if}
      </div>

      {#if service.description}
        <div class="rich-text">{service.description}</div>
      {/if}

      {#if service.addons && service.addons.length > 0}
        <div class="addon-preview">
          <Eyebrow>Available add-ons</Eyebrow>
          <ul>
            {#each service.addons as addon}
              <li>
                <span>{addon.name}</span>
                <span class="addon-price">
                  +{formatMoney(Number(addon.price) || 0)}
                </span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      <div class="button-row">
        <Button href="/bookings/{service.id}/book" size="lg">
          <CalendarDays size={16} strokeWidth={1.8} />
          Reserve a slot
        </Button>
        <Button href="/bookings" variant="ghost">
          <ArrowLeft size={16} strokeWidth={1.8} />
          Back to services
        </Button>
      </div>
    </div>
  </div>
</section>

{#if data.related.length}
  <section class="site-section site-section--bordered">
    <div class="site-container">
      <div class="section-heading">
        <div>
          <Eyebrow>Related</Eyebrow>
          <h2 class="site-h2">More services</h2>
        </div>
      </div>
      <div class="related-grid">
        {#each data.related as related (related.id)}
          <ServiceCard service={related} />
        {/each}
      </div>
    </div>
  </section>
{/if}

<style>
  .service-detail {
    padding-top: clamp(20px, 3vw, 36px);
    padding-bottom: clamp(40px, 5vw, 72px);
  }
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted, #6b6b6b);
    margin-bottom: clamp(20px, 2.5vw, 32px);
  }
  .back-link:hover {
    color: var(--ink, #111);
  }
  .service-detail-grid {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: clamp(24px, 4vw, 56px);
    align-items: start;
  }
  @media (max-width: 820px) {
    .service-detail-grid {
      grid-template-columns: 1fr;
    }
  }
  .service-detail-media {
    position: relative;
    aspect-ratio: 4 / 5;
    border-radius: var(--radius-card, 10px);
    overflow: hidden;
    background: #f3f4f6;
  }
  .service-detail-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .service-detail-media .image-fallback {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    color: var(--muted, #6b6b6b);
  }
  .service-detail-copy {
    display: grid;
    gap: 16px;
    align-content: start;
  }
  .price {
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 2.4vw, 2rem);
    font-variant-numeric: tabular-nums;
    margin: 0;
    color: var(--ink, #111);
  }
  .service-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 14px 0;
    border-top: 1px solid var(--line, #e5e7eb);
    border-bottom: 1px solid var(--line, #e5e7eb);
    font-size: 13px;
    color: var(--ink-soft, #2a2a2a);
  }
  .service-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .service-meta-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    background: var(--accent-soft, #eef2ff);
    color: var(--accent, #1e3a8a);
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .service-meta-tag--lock {
    background: #fef3c7;
    color: #92400e;
  }
  .addon-preview {
    margin-top: 8px;
    padding: 18px 20px;
    background: var(--surface, #fff);
    border: 1px solid var(--line, #e5e7eb);
    border-radius: var(--radius-card, 10px);
  }
  .addon-preview ul {
    list-style: none;
    padding: 0;
    margin: 12px 0 0;
    display: grid;
    gap: 8px;
  }
  .addon-preview li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
    color: var(--ink, #111);
  }
  .addon-price {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    color: var(--muted, #6b6b6b);
  }
  .button-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 8px;
  }
  .related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: clamp(18px, 2vw, 28px);
  }
</style>
