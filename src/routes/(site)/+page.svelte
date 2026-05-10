<script lang="ts">
  import { ArrowRight, CalendarDays, PackageSearch, Sparkles } from "lucide-svelte";
  import { formatMoney } from "$lib/format";
  import { productHref, productImage, productPrice } from "$lib/product";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<section class="hero">
  <div class="hero-copy">
    <p class="eyebrow">Headless FavCRM storefront</p>
    <h1>{data.tenant.brandName}</h1>
    <p>
      A commerce, booking, event, and member portal experience powered by the
      FavCRM customer API.
    </p>
    <div class="button-row">
      <a class="primary-link" href="/shop">
        Browse shop <ArrowRight size={18} />
      </a>
      <a class="secondary-link" href="/bookings">Book a service</a>
    </div>
  </div>

  <div class="product-strip" aria-label="Featured products">
    {#each data.products.slice(0, 3) as product}
      {@const image = productImage(product)}
      <a class="feature-product" href={productHref(product)}>
        {#if image}
          <img src={image} alt={product.name} />
        {:else}
          <span class="image-fallback"><PackageSearch size={30} /></span>
        {/if}
        <span>{product.name}</span>
      </a>
    {:else}
      <div class="empty-visual">
        <Sparkles size={34} />
        <span>Connect a FavCRM company to render live catalog assets.</span>
      </div>
    {/each}
  </div>
</section>

<section class="feature-band">
  <a href="/shop">
    <PackageSearch size={22} />
    <strong>Commerce</strong>
    <span>Products, categories, cart, checkout, orders, and reviews.</span>
  </a>
  <a href="/bookings">
    <CalendarDays size={22} />
    <strong>Bookings</strong>
    <span>Services, staff, resources, time slots, and member history.</span>
  </a>
  <a href="/member">
    <Sparkles size={22} />
    <strong>Membership</strong>
    <span>OTP sign-in, profile, member card, invoices, and subscriptions.</span>
  </a>
</section>

<section class="section-heading">
  <p class="eyebrow">Live catalog</p>
  <h2>Featured Products</h2>
</section>

<div class="product-grid">
  {#each data.products as product}
    {@const image = productImage(product)}
    <a class="product-card" href={productHref(product)}>
      {#if image}
        <img src={image} alt={product.name} />
      {:else}
        <span class="image-fallback"><PackageSearch size={28} /></span>
      {/if}
      <strong>{product.name}</strong>
      <span>{formatMoney(productPrice(product))}</span>
    </a>
  {:else}
    <p class="empty-state">No products are published yet.</p>
  {/each}
</div>
