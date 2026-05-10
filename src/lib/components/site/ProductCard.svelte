<script lang="ts">
  import { PackageSearch, Plus, ShoppingBag } from "lucide-svelte";
  import { formatMoney } from "$lib/format";
  import { cart } from "$lib/stores/cart";
  import { toasts } from "$lib/stores/toast";
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
  const isOutOfStock = $derived(product.stockStatus === "out_of_stock");
  const requiresVariation = $derived(product.isVariable === true);

  function handleQuickAdd(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (requiresVariation) return;
    if (isOutOfStock) {
      toasts.error(`${product.name} is out of stock`);
      return;
    }
    const result = cart.add(product);
    if (result.ok) {
      toasts.success(`Added "${product.name}" to cart`);
      return;
    }
    if (result.reason === "out_of_stock") {
      toasts.error(`${product.name} is out of stock`);
      return;
    }
    toasts.info(
      `Only ${result.available} available — cart adjusted to maximum.`,
    );
  }
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
    {#if isOutOfStock}
      <span class="product-card-flag">Sold out</span>
    {/if}
    {#if !requiresVariation && !isOutOfStock}
      <button
        type="button"
        class="product-card-quickadd"
        onclick={handleQuickAdd}
        aria-label="Add {product.name} to cart"
      >
        <Plus size={14} strokeWidth={2.2} />
      </button>
    {:else if requiresVariation && !isOutOfStock}
      <span class="product-card-pill" aria-hidden="true">
        <ShoppingBag size={12} strokeWidth={1.6} />
        Choose options
      </span>
    {/if}
  </div>
  <span class="product-card-title">{product.name}</span>
  <span class="product-card-price">{price}</span>
</a>

<style>
  .product-card-media {
    position: relative;
  }
  .product-card-quickadd {
    position: absolute;
    bottom: 8px;
    right: 8px;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    background: var(--ink, #111);
    color: var(--paper, #fafaf7);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgb(17 17 17 / 18%);
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 160ms ease, transform 160ms ease, background 120ms;
    cursor: pointer;
  }
  .product-card-media:hover .product-card-quickadd,
  .product-card-quickadd:focus-visible {
    opacity: 1;
    transform: translateY(0);
  }
  .product-card-quickadd:hover {
    background: var(--accent, #1e3a8a);
  }
  .product-card-pill {
    position: absolute;
    bottom: 8px;
    right: 8px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.92);
    color: var(--ink, #111);
    border-radius: 999px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .product-card-flag {
    position: absolute;
    top: 8px;
    left: 8px;
    padding: 4px 8px;
    background: var(--ink, #111);
    color: var(--paper, #fafaf7);
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
</style>
