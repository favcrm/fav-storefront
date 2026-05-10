<script lang="ts">
  import { ShoppingBag } from "lucide-svelte";
  import { cart } from "$lib/stores/cart";
  import { formatMoney } from "$lib/format";
  import { productHref, productImage, productPrice } from "$lib/product";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let image = $derived(productImage(data.product));
</script>

<section class="detail-shell">
  <div class="detail-media">
    {#if image}
      <img src={image} alt={data.product.name} />
    {/if}
  </div>
  <div class="detail-copy">
    <p class="eyebrow">Product</p>
    <h1>{data.product.name}</h1>
    <p class="price">{formatMoney(productPrice(data.product))}</p>
    {#if data.product.description}
      <div class="rich-text">{data.product.description}</div>
    {/if}
    <button class="primary-link" type="button" onclick={() => cart.add(data.product)}>
      <ShoppingBag size={18} />
      Add to cart
    </button>
  </div>
</section>

{#if data.related.length}
  <section class="page-shell">
    <div class="section-heading">
      <p class="eyebrow">Related</p>
      <h2>You may also like</h2>
    </div>
    <div class="product-grid">
      {#each data.related as product}
        {@const relatedImage = productImage(product)}
        <a class="product-card" href={productHref(product)}>
          {#if relatedImage}<img src={relatedImage} alt={product.name} />{/if}
          <strong>{product.name}</strong>
          <span>{formatMoney(productPrice(product))}</span>
        </a>
      {/each}
    </div>
  </section>
{/if}
