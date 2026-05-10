<script lang="ts">
  import { PackageSearch } from "lucide-svelte";
  import { formatMoney } from "$lib/format";
  import {
    productHref,
    productImage,
    productPrice,
    type StorefrontProduct,
  } from "$lib/product";

  let { product }: { product: StorefrontProduct } = $props();

  const image = $derived(productImage(product));
  const href = $derived(productHref(product));
  const price = $derived(formatMoney(productPrice(product)));
</script>

<a class="product-card" {href}>
  <div class="product-card-media">
    {#if image}
      <img src={image} alt={product.name} loading="lazy" />
    {:else}
      <span class="image-fallback">
        <PackageSearch size={28} strokeWidth={1.4} />
      </span>
    {/if}
  </div>
  <span class="product-card-title">{product.name}</span>
  <span class="product-card-price">{price}</span>
</a>
