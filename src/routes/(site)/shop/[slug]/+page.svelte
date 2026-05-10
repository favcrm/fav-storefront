<script lang="ts">
  import { ArrowLeft, PackageSearch, ShoppingBag } from "lucide-svelte";
  import { cart } from "$lib/stores/cart";
  import { formatMoney } from "$lib/format";
  import { productImage, productPrice } from "$lib/product";
  import Button from "$lib/components/site/Button.svelte";
  import Eyebrow from "$lib/components/site/Eyebrow.svelte";
  import ProductCard from "$lib/components/site/ProductCard.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let image = $derived(productImage(data.product));
</script>

<section class="site-container detail-shell">
  <div class="detail-media">
    {#if image}
      <img src={image} alt={data.product.name} />
    {:else}
      <span class="image-fallback">
        <PackageSearch size={36} strokeWidth={1.3} />
      </span>
    {/if}
  </div>

  <div class="detail-copy">
    <Eyebrow>Product</Eyebrow>
    <h1 class="site-h1">{data.product.name}</h1>
    <p class="price">{formatMoney(productPrice(data.product))}</p>
    {#if data.product.description}
      <div class="rich-text">{data.product.description}</div>
    {/if}
    <div class="button-row">
      <Button onclick={() => cart.add(data.product)} size="lg">
        <ShoppingBag size={16} strokeWidth={1.8} />
        Add to cart
      </Button>
      <Button href="/shop" variant="ghost">
        <ArrowLeft size={16} strokeWidth={1.8} />
        Continue shopping
      </Button>
    </div>
  </div>
</section>

{#if data.related.length}
  <section class="site-section site-section--bordered">
    <div class="site-container">
      <div class="section-heading">
        <div>
          <Eyebrow>Related</Eyebrow>
          <h2 class="site-h2">You may also like</h2>
        </div>
      </div>
      <div class="product-grid">
        {#each data.related as product}
          <ProductCard {product} />
        {/each}
      </div>
    </div>
  </section>
{/if}
