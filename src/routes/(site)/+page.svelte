<script lang="ts">
  import {
    ArrowRight,
    CalendarDays,
    PackageSearch,
    Sparkles,
    UserRound,
  } from "lucide-svelte";
  import { productHref, productImage } from "$lib/product";
  import Eyebrow from "$lib/components/site/Eyebrow.svelte";
  import Button from "$lib/components/site/Button.svelte";
  import ProductCard from "$lib/components/site/ProductCard.svelte";
  import FeatureCard from "$lib/components/site/FeatureCard.svelte";
  import EmptyState from "$lib/components/site/EmptyState.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const stripProducts = $derived(data.products.slice(0, 3));
  const hasProducts = $derived(data.products.length > 0);

  let schemaOrg = $derived({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Storefront",
    "url": typeof window !== "undefined" ? window.location.origin : undefined,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": (typeof window !== "undefined" ? window.location.origin : "") + "/shop?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  });
</script>

<svelte:head>
  <title>Home - Storefront</title>
  <meta name="description" content="Welcome to the official Storefront. Browse our products, book services, and explore upcoming events." />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html `<script type="application/ld+json">${JSON.stringify(schemaOrg)}</script>`}
</svelte:head>

<section class="site-container hero">
  <svg
    class="hero-decor"
    viewBox="0 0 140 140"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="currentColor">
      {#each Array(12) as _, row}
        {#each Array(12) as _, col}
          <circle cx={6 + col * 12} cy={6 + row * 12} r="1" />
        {/each}
      {/each}
    </g>
    <line
      x1="0"
      y1="140"
      x2="140"
      y2="0"
      stroke="currentColor"
      stroke-width="1"
    />
  </svg>

  <div class="hero-copy">
    <Eyebrow>Storefront template</Eyebrow>
    <h1 class="site-h1 site-h1--display">{data.tenant.brandName}</h1>
    <p class="site-lead">
      A modern commerce, booking, and member experience — wired to the FavCRM
      customer API and ready to make your own.
    </p>
    <div class="button-row">
      <Button href="/shop" size="lg">
        Browse shop
        <ArrowRight size={16} strokeWidth={1.8} />
      </Button>
      <Button href="/bookings" variant="secondary" size="lg">
        Book a service
      </Button>
    </div>
  </div>

  <div class="hero-media" aria-label="Featured products">
    {#if hasProducts}
      <div class="product-strip">
        {#each stripProducts as product}
          {@const image = productImage(product)}
          <a class="product-strip-card" href={productHref(product)}>
            {#if image}
              <img src={image} alt={product.name} loading="lazy" />
            {:else}
              <span class="image-fallback">
                <PackageSearch size={28} strokeWidth={1.4} />
              </span>
            {/if}
            <span class="strip-label">
              <span>{product.name}</span>
              <ArrowRight size={14} strokeWidth={1.8} />
            </span>
          </a>
        {/each}
      </div>
    {:else}
      <EmptyState
        icon={Sparkles}
        title="Connect a workspace"
        description="Configure VITE_FAVCRM_COMPANY_ID to render your live catalog."
      />
    {/if}
  </div>
</section>

<section class="feature-band site-container">
  <FeatureCard
    href="/shop"
    icon={PackageSearch}
    title="Commerce"
    description="Products, categories, cart, checkout, orders, and reviews."
  />
  <FeatureCard
    href="/bookings"
    icon={CalendarDays}
    title="Bookings"
    description="Services, staff, resources, time slots, and member history."
  />
  <FeatureCard
    href="/member"
    icon={UserRound}
    title="Membership"
    description="OTP sign-in, profile, member card, invoices, and subscriptions."
  />
</section>

<section class="site-section">
  <div class="site-container">
    <div class="section-heading">
      <div>
        <Eyebrow>Live catalog</Eyebrow>
        <h2 class="site-h2">Featured</h2>
      </div>
      {#if hasProducts}
        <a class="section-heading-link" href="/shop">
          View all
          <ArrowRight size={14} strokeWidth={1.8} />
        </a>
      {/if}
    </div>

    {#if hasProducts}
      <div class="product-grid">
        {#each data.products as product}
          <ProductCard {product} />
        {/each}
      </div>
    {:else}
      <EmptyState
        title="No products published"
        description="Add products in your FavCRM workspace to see them appear here."
      />
    {/if}
  </div>
</section>
