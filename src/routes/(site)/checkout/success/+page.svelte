<script lang="ts">
  import { Check, Info } from "lucide-svelte";
  import { formatMoney } from "$lib/format";
  import Button from "$lib/components/site/Button.svelte";
  import Eyebrow from "$lib/components/site/Eyebrow.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Order placed</title>
</svelte:head>

<section class="site-section">
  <div class="site-container success-shell">
    <div class="success-mark" aria-hidden="true">
      <Check size={22} strokeWidth={1.8} />
    </div>
    <Eyebrow>Confirmed</Eyebrow>
    <h1 class="site-h1">Thanks for your order</h1>

    {#if data.order}
      <p class="success-body">
        Your order is in our queue. We'll send a confirmation email once payment
        is recorded.
      </p>

      {#if data.order.paymentInstructions}
        <div class="success-instructions" role="note">
          <div class="success-instructions-head">
            <Info size={14} strokeWidth={1.8} />
            <span>Payment instructions</span>
          </div>
          <p>{data.order.paymentInstructions}</p>
        </div>
      {/if}

      <div class="receipt">
        <div class="receipt-head">
          <Eyebrow>Order</Eyebrow>
          <h2>{data.order.orderNumber ?? data.order.orderId}</h2>
        </div>

        <ul class="receipt-items">
          {#each data.order.items as item, idx (idx)}
            <li>
              <span class="receipt-item-name">
                {item.productName}
                <span class="receipt-item-qty">× {item.quantity}</span>
              </span>
              <span class="receipt-item-total">
                {formatMoney(item.lineTotal)}
              </span>
            </li>
          {/each}
        </ul>

        <dl class="receipt-rows">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatMoney(data.order.subtotal)}</dd>
          </div>
          {#if data.order.discountAmount > 0}
            <div>
              <dt>Discount</dt>
              <dd class="discount">−{formatMoney(data.order.discountAmount)}</dd>
            </div>
          {/if}
          <div>
            <dt>Shipping</dt>
            <dd>
              {data.order.shippingCost === 0
                ? "Free"
                : formatMoney(data.order.shippingCost)}
            </dd>
          </div>
        </dl>

        <div class="receipt-total">
          <span>Total</span>
          <span class="receipt-total-amount">
            {formatMoney(data.order.totalAmount)}
          </span>
        </div>

        <p class="receipt-status">Status: <strong>{data.order.status}</strong></p>
      </div>
    {:else if data.orderUuid}
      <p class="success-body">
        Your order <code>{data.orderUuid}</code> was placed
        {#if data.loadError}— but we couldn't load the receipt:
          <span class="success-error">{data.loadError}</span>
        {/if}
      </p>
    {:else}
      <p class="success-body">
        Your order has been placed. Check your inbox for the confirmation.
      </p>
    {/if}

    <div class="success-actions">
      <Button href="/member">View orders</Button>
      <Button href="/shop" variant="ghost">Continue shopping</Button>
    </div>
  </div>
</section>

<style>
  .success-shell {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 14px;
    padding: 48px 0 80px;
  }
  .success-mark {
    width: 56px;
    height: 56px;
    border-radius: 999px;
    background: #ecfdf5;
    color: #047857;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #a7f3d0;
    margin-bottom: 6px;
  }
  .success-body {
    color: var(--muted, #6b6b6b);
    max-width: 520px;
    line-height: 1.55;
  }
  .success-error {
    color: #b91c1c;
  }
  .success-instructions {
    width: 100%;
    max-width: 520px;
    text-align: left;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 10px;
    padding: 14px 16px;
    color: #92400e;
  }
  .success-instructions-head {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 6px;
  }
  .success-instructions p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-line;
  }
  .receipt {
    width: 100%;
    max-width: 520px;
    text-align: left;
    background: var(--surface, #fff);
    border: 1px solid var(--line, #e6e4de);
    border-radius: 12px;
    padding: 24px;
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .receipt-head h2 {
    font-family: var(--font-display, Georgia, serif);
    margin: 4px 0 0;
    font-size: 22px;
    line-height: 1.1;
  }
  .receipt-items {
    list-style: none;
    padding: 0;
    margin: 0;
    border-top: 1px solid var(--line, #e6e4de);
    padding-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .receipt-items li {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
  }
  .receipt-item-name {
    flex: 1;
  }
  .receipt-item-qty {
    color: var(--muted, #6b6b6b);
    margin-left: 4px;
  }
  .receipt-item-total {
    font-variant-numeric: tabular-nums;
  }
  .receipt-rows {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-top: 1px solid var(--line, #e6e4de);
    padding-top: 12px;
  }
  .receipt-rows div {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
  }
  .receipt-rows dt {
    color: var(--muted, #6b6b6b);
  }
  .receipt-rows dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }
  .receipt-rows .discount {
    color: #047857;
  }
  .receipt-total {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-top: 12px;
    border-top: 1px solid var(--line, #e6e4de);
    font-size: 16px;
  }
  .receipt-total-amount {
    font-family: var(--font-display, Georgia, serif);
    font-size: 22px;
    font-variant-numeric: tabular-nums;
  }
  .receipt-status {
    font-size: 12px;
    color: var(--muted, #6b6b6b);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0;
  }
  .success-actions {
    margin-top: 8px;
    display: inline-flex;
    gap: 12px;
  }
</style>
