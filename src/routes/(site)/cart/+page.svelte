<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { ArrowLeft, Minus, PackageSearch, Plus, Trash2 } from "lucide-svelte";
  import { cart, cartLineKey, cartSubtotal } from "$lib/stores/cart";
  import { toasts } from "$lib/stores/toast";
  import { formatMoney } from "$lib/format";
  import Button from "$lib/components/site/Button.svelte";
  import Eyebrow from "$lib/components/site/Eyebrow.svelte";
  import EmptyState from "$lib/components/site/EmptyState.svelte";
  import PageHeader from "$lib/components/site/PageHeader.svelte";

  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  });

  function inc(key: string, current: number) {
    cart.setQuantity(key, current + 1);
  }

  function dec(key: string, current: number) {
    cart.setQuantity(key, current - 1);
  }

  function remove(key: string, name: string) {
    const removed = cart.remove(key);
    if (!removed) return;
    toasts.info(`Removed "${name}" from cart`, {
      ttl: 5000,
      action: {
        label: "Undo",
        onPress: () => cart.restore(removed),
      },
    });
  }

  function checkout() {
    goto("/checkout");
  }
</script>

<svelte:head>
  <title>Cart</title>
</svelte:head>

<PageHeader eyebrow="Cart" title="Your bag" />

<section class="site-section">
  <div class="site-container cart-shell">
    {#if !mounted}
      <div class="cart-skeleton" aria-hidden="true">
        <div class="cart-skel-row"></div>
        <div class="cart-skel-row"></div>
      </div>
    {:else if $cart.length === 0}
      <div class="cart-empty">
        <EmptyState
          title="Your cart is empty"
          description="Browse the catalog and add something you like."
        />
        <div class="cart-empty-action">
          <Button href="/shop" variant="secondary">Go to shop</Button>
        </div>
      </div>
    {:else}
      <div class="cart-grid">
        <ul class="cart-list" aria-label="Cart items">
          {#each $cart as item (cartLineKey(item))}
            {@const key = cartLineKey(item)}
            <li class="cart-row">
              <div class="cart-row-media">
                {#if item.product.image}
                  <img src={item.product.image} alt={item.product.name} />
                {:else}
                  <span class="cart-row-fallback">
                    <PackageSearch size={22} strokeWidth={1.3} />
                  </span>
                {/if}
              </div>
              <div class="cart-row-body">
                <a
                  class="cart-row-name"
                  href={item.product.slug
                    ? `/shop/${item.product.slug}`
                    : "/shop"}
                >
                  {item.product.name}
                </a>
                {#if item.variationName}
                  <p class="cart-row-variant">{item.variationName}</p>
                {:else if item.product.categoryName}
                  <p class="cart-row-meta">{item.product.categoryName}</p>
                {/if}
                <p class="cart-row-price">
                  {formatMoney(item.product.price ?? 0)}
                </p>
              </div>
              <div class="cart-row-qty" role="group" aria-label="Quantity">
                <button
                  type="button"
                  class="qty-btn"
                  aria-label="Decrease quantity"
                  onclick={() => dec(key, item.quantity)}
                >
                  <Minus size={14} strokeWidth={1.8} />
                </button>
                <span class="qty-value" aria-live="polite">{item.quantity}</span>
                <button
                  type="button"
                  class="qty-btn"
                  aria-label="Increase quantity"
                  onclick={() => inc(key, item.quantity)}
                >
                  <Plus size={14} strokeWidth={1.8} />
                </button>
              </div>
              <div class="cart-row-total">
                {formatMoney((item.product.price ?? 0) * item.quantity)}
              </div>
              <button
                type="button"
                class="cart-row-remove"
                aria-label="Remove from cart"
                onclick={() => remove(key, item.product.name)}
              >
                <Trash2 size={15} strokeWidth={1.6} />
              </button>
            </li>
          {/each}
        </ul>

        <aside class="cart-summary" aria-label="Order summary">
          <Eyebrow>Summary</Eyebrow>
          <h2 class="cart-summary-title">Order total</h2>
          <dl class="cart-summary-rows">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney($cartSubtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd class="muted">Calculated at checkout</dd>
            </div>
          </dl>
          <div class="cart-summary-total">
            <span>Total</span>
            <span class="cart-summary-amount">{formatMoney($cartSubtotal)}</span>
          </div>
          <Button size="lg" onclick={checkout}>Checkout</Button>
          <Button href="/shop" variant="ghost">
            <ArrowLeft size={15} strokeWidth={1.7} />
            Continue shopping
          </Button>
        </aside>
      </div>
    {/if}
  </div>
</section>

<style>
  .cart-shell {
    padding-top: 8px;
    padding-bottom: 64px;
  }
  .cart-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px 0;
  }
  .cart-empty-action {
    display: inline-flex;
  }
  .cart-skeleton {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .cart-skel-row {
    height: 88px;
    background: linear-gradient(
      90deg,
      var(--surface, #fff) 0%,
      #f3f4f6 50%,
      var(--surface, #fff) 100%
    );
    background-size: 200% 100%;
    animation: cart-skel 1.2s infinite linear;
    border-radius: 8px;
    border: 1px solid var(--line, #e6e4de);
  }
  @keyframes cart-skel {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  .cart-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 32px;
  }
  @media (min-width: 960px) {
    .cart-grid {
      grid-template-columns: minmax(0, 1fr) 320px;
      gap: 48px;
      align-items: start;
    }
  }
  .cart-list {
    list-style: none;
    padding: 0;
    margin: 0;
    border-top: 1px solid var(--line, #e6e4de);
  }
  .cart-row {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr) auto auto auto;
    align-items: center;
    gap: 16px;
    padding: 18px 0;
    border-bottom: 1px solid var(--line, #e6e4de);
  }
  @media (max-width: 640px) {
    .cart-row {
      grid-template-columns: 56px minmax(0, 1fr) auto;
      grid-template-rows: auto auto;
      row-gap: 8px;
    }
    .cart-row-qty {
      grid-column: 2 / 3;
    }
    .cart-row-total {
      grid-column: 3 / 4;
      grid-row: 1 / 2;
      align-self: start;
    }
    .cart-row-remove {
      grid-column: 3 / 4;
      grid-row: 2 / 3;
      justify-self: end;
    }
  }
  .cart-row-media {
    width: 72px;
    height: 72px;
    border-radius: 8px;
    overflow: hidden;
    background: var(--surface, #fff);
    border: 1px solid var(--line, #e6e4de);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cart-row-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .cart-row-fallback {
    color: var(--muted, #6b6b6b);
  }
  .cart-row-body {
    min-width: 0;
  }
  .cart-row-name {
    display: inline-block;
    font-weight: 500;
    color: var(--ink, #111);
    text-decoration: none;
    line-height: 1.3;
  }
  .cart-row-name:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .cart-row-variant {
    margin: 2px 0 0;
    font-size: 12px;
    color: var(--ink, #111);
  }
  .cart-row-meta {
    margin: 2px 0 0;
    font-size: 12px;
    color: var(--muted, #6b6b6b);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .cart-row-price {
    margin: 6px 0 0;
    font-size: 13px;
    color: var(--muted, #6b6b6b);
  }
  .cart-row-qty {
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--line, #e6e4de);
    border-radius: 999px;
    overflow: hidden;
  }
  .qty-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: var(--ink, #111);
    background: transparent;
    transition: background 120ms;
  }
  .qty-btn:hover {
    background: var(--line, #e6e4de);
  }
  .qty-value {
    min-width: 28px;
    text-align: center;
    font-variant-numeric: tabular-nums;
    font-size: 14px;
  }
  .cart-row-total {
    font-variant-numeric: tabular-nums;
    font-weight: 500;
    color: var(--ink, #111);
  }
  .cart-row-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    color: var(--muted, #6b6b6b);
    transition: color 120ms, background 120ms;
  }
  .cart-row-remove:hover {
    color: #b91c1c;
    background: #fef2f2;
  }
  .cart-summary {
    background: var(--surface, #fff);
    border: 1px solid var(--line, #e6e4de);
    border-radius: 12px;
    padding: 24px;
    position: sticky;
    top: 96px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .cart-summary-title {
    font-family: var(--font-display, Georgia, serif);
    font-size: 24px;
    margin: 0;
    line-height: 1.1;
  }
  .cart-summary-rows {
    margin: 6px 0 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .cart-summary-rows div {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
  }
  .cart-summary-rows dt {
    color: var(--muted, #6b6b6b);
  }
  .cart-summary-rows dd {
    margin: 0;
    color: var(--ink, #111);
    font-variant-numeric: tabular-nums;
  }
  .cart-summary-rows .muted {
    color: var(--muted, #6b6b6b);
    font-size: 13px;
  }
  .cart-summary-total {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-top: 14px;
    border-top: 1px solid var(--line, #e6e4de);
    font-size: 16px;
  }
  .cart-summary-amount {
    font-family: var(--font-display, Georgia, serif);
    font-size: 22px;
    font-variant-numeric: tabular-nums;
  }
</style>
