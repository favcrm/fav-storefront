<script lang="ts">
  import { ArrowLeft, Minus, PackageSearch, Plus, ShoppingBag } from "lucide-svelte";
  import type { ProductVariation } from "@favcrm/sdk";
  import { goto } from "$app/navigation";
  import { cart } from "$lib/stores/cart";
  import { toasts } from "$lib/stores/toast";
  import { formatMoney } from "$lib/format";
  import { productImage, productPrice } from "$lib/product";
  import Button from "$lib/components/site/Button.svelte";
  import Eyebrow from "$lib/components/site/Eyebrow.svelte";
  import ProductCard from "$lib/components/site/ProductCard.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const isVariable = $derived(
    data.product.isVariable && data.product.options.length > 0,
  );

  let selectedOptions = $state<Record<string, string>>({});
  let quantity = $state(1);

  const variation = $derived<ProductVariation | null>(
    isVariable ? findVariation(selectedOptions) : null,
  );

  const allOptionsChosen = $derived(
    isVariable
      ? data.product.options.every((opt) => Boolean(selectedOptions[opt.name]))
      : true,
  );

  const baseImage = $derived(productImage(data.product));

  const unitPrice = $derived(
    variation ? variation.price : (productPrice(data.product) ?? 0),
  );

  const stockQuantity = $derived(getStock());
  const stockStatus = $derived(
    variation ? variation.stockStatus : data.product.stockStatus,
  );
  const isOutOfStock = $derived(
    stockStatus === "out_of_stock" || stockQuantity === 0,
  );

  const canAdd = $derived(
    !isOutOfStock && (!isVariable || (allOptionsChosen && variation !== null)),
  );

  const maxQty = $derived(
    stockQuantity !== null && stockQuantity > 0 ? stockQuantity : 99,
  );

  function findVariation(
    chosen: Record<string, string>,
  ): ProductVariation | null {
    if (!data.product.variations || data.product.variations.length === 0) {
      return null;
    }
    return (
      data.product.variations.find((v) =>
        v.selectedOptions.every(
          (so) => chosen[so.optionName] === so.value,
        ),
      ) ?? null
    );
  }

  function getStock(): number | null {
    if (variation) {
      if (variation.stockStatus === "out_of_stock") return 0;
      return typeof variation.stockQuantity === "number"
        ? variation.stockQuantity
        : null;
    }
    if (data.product.stockStatus === "out_of_stock") return 0;
    return typeof data.product.stockQuantity === "number"
      ? data.product.stockQuantity
      : null;
  }

  function isOptionAvailable(optionName: string, value: string): boolean {
    if (!data.product.variations) return true;
    const trial = { ...selectedOptions, [optionName]: value };
    return data.product.variations.some(
      (v) =>
        v.stockStatus !== "out_of_stock" &&
        v.selectedOptions.every((so) => {
          if (so.optionName === optionName) return so.value === value;
          const picked = trial[so.optionName];
          return !picked || picked === so.value;
        }),
    );
  }

  function selectOption(optionName: string, value: string) {
    selectedOptions = { ...selectedOptions, [optionName]: value };
    quantity = 1;
  }

  function changeQty(delta: number) {
    const next = quantity + delta;
    if (next < 1) return;
    if (next > maxQty) {
      toasts.info(`Only ${maxQty} available.`);
      quantity = maxQty;
      return;
    }
    quantity = next;
  }

  function addToCart() {
    if (!canAdd) {
      if (isVariable && !allOptionsChosen) {
        toasts.error("Please choose all options first.");
      } else if (isOutOfStock) {
        toasts.error(`${data.product.name} is out of stock`);
      }
      return;
    }
    const result = cart.add(data.product, {
      quantity,
      variation: variation ?? undefined,
    });
    const label = variation
      ? `${data.product.name} — ${variation.name}`
      : data.product.name;
    if (result.ok) {
      toasts.success(`Added "${label}" to cart`, {
        action: { label: "View cart", onPress: () => goto("/cart") },
      });
      return;
    }
    if (result.reason === "out_of_stock") {
      toasts.error(`${label} is out of stock`);
      return;
    }
    toasts.info(
      `Only ${result.available} available — cart adjusted to maximum.`,
    );
  }
</script>

<section class="site-container detail-shell">
  <div class="detail-media">
    {#if baseImage}
      <img src={baseImage} alt={data.product.name} />
    {:else}
      <span class="image-fallback">
        <PackageSearch size={36} strokeWidth={1.3} />
      </span>
    {/if}
    {#if isOutOfStock}
      <span class="detail-flag">Sold out</span>
    {/if}
  </div>

  <div class="detail-copy">
    <Eyebrow>Product</Eyebrow>
    <h1 class="site-h1">{data.product.name}</h1>
    <p class="price">{formatMoney(unitPrice)}</p>

    {#if data.product.description}
      <div class="rich-text">{data.product.description}</div>
    {/if}

    {#if isVariable}
      <div class="variation-groups">
        {#each data.product.options as option (option.id)}
          <div class="variation-group">
            <div class="variation-group-label">
              <span class="variation-group-name">{option.name}</span>
              {#if selectedOptions[option.name]}
                <span class="variation-group-value">
                  {selectedOptions[option.name]}
                </span>
              {/if}
            </div>
            <div class="variation-choices" role="radiogroup" aria-label={option.name}>
              {#each option.values as v (v.id)}
                {@const available = isOptionAvailable(option.name, v.value)}
                {@const chosen = selectedOptions[option.name] === v.value}
                <button
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  class="variation-chip"
                  class:is-active={chosen}
                  class:is-unavailable={!available}
                  disabled={!available}
                  onclick={() => selectOption(option.name, v.value)}
                >
                  {v.value}
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <div class="qty-block">
      <span class="qty-label">Quantity</span>
      <div class="qty-stepper" role="group" aria-label="Quantity">
        <button
          type="button"
          class="qty-step-btn"
          aria-label="Decrease"
          onclick={() => changeQty(-1)}
          disabled={quantity <= 1}
        >
          <Minus size={14} strokeWidth={1.8} />
        </button>
        <span class="qty-step-value" aria-live="polite">{quantity}</span>
        <button
          type="button"
          class="qty-step-btn"
          aria-label="Increase"
          onclick={() => changeQty(1)}
          disabled={quantity >= maxQty}
        >
          <Plus size={14} strokeWidth={1.8} />
        </button>
      </div>
      {#if stockQuantity !== null && stockQuantity > 0 && stockQuantity <= 5}
        <span class="qty-stock">Only {stockQuantity} left</span>
      {/if}
    </div>

    <div class="button-row">
      <Button onclick={addToCart} size="lg" disabled={!canAdd}>
        <ShoppingBag size={16} strokeWidth={1.8} />
        {isOutOfStock ? "Out of stock" : "Add to cart"}
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

<style>
  .detail-media {
    position: relative;
  }
  .detail-flag {
    position: absolute;
    top: 14px;
    left: 14px;
    padding: 5px 10px;
    background: var(--ink, #111);
    color: var(--paper, #fafaf7);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .variation-groups {
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin: 8px 0 4px;
  }
  .variation-group-label {
    display: flex;
    gap: 8px;
    align-items: baseline;
    font-size: 13px;
    margin-bottom: 8px;
  }
  .variation-group-name {
    color: var(--muted, #6b6b6b);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
    font-size: 11px;
  }
  .variation-group-value {
    color: var(--ink, #111);
  }
  .variation-choices {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .variation-chip {
    min-width: 44px;
    padding: 8px 14px;
    border: 1px solid var(--line, #e6e4de);
    background: var(--surface, #fff);
    border-radius: 999px;
    font-size: 13px;
    color: var(--ink, #111);
    cursor: pointer;
    transition: border-color 120ms, background 120ms, color 120ms;
  }
  .variation-chip:hover:not(:disabled) {
    border-color: var(--ink, #111);
  }
  .variation-chip.is-active {
    background: var(--ink, #111);
    color: var(--paper, #fafaf7);
    border-color: var(--ink, #111);
  }
  .variation-chip.is-unavailable {
    color: #9ca3af;
    text-decoration: line-through;
    cursor: not-allowed;
    opacity: 0.6;
  }
  .qty-block {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 8px 0 4px;
  }
  .qty-label {
    color: var(--muted, #6b6b6b);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
    font-size: 11px;
  }
  .qty-stepper {
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--line, #e6e4de);
    border-radius: 999px;
    overflow: hidden;
  }
  .qty-step-btn {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: var(--ink, #111);
    transition: background 120ms;
  }
  .qty-step-btn:hover:not(:disabled) {
    background: var(--line, #e6e4de);
  }
  .qty-step-btn:disabled {
    color: #cbd5e1;
    cursor: not-allowed;
  }
  .qty-step-value {
    min-width: 36px;
    text-align: center;
    font-variant-numeric: tabular-nums;
    font-size: 14px;
  }
  .qty-stock {
    font-size: 12px;
    color: #b45309;
  }
</style>
