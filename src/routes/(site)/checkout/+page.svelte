<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { ArrowLeft, Lock, Tag, X } from "lucide-svelte";
  import {
    buildCreateOrderRequest,
    buildAppliedCoupon,
    calculateFinalTotal,
    computeShippingEligibility,
    getCouponErrorMessage,
    pickDefaultShippingId,
    validateCheckoutForm,
    type AppliedCoupon,
    type CheckoutFormFields,
    type ShippingEligibility,
  } from "@favcrm/sdk";
  import { cart, cartSubtotal } from "$lib/stores/cart";
  import { toasts } from "$lib/stores/toast";
  import { createFavCRM } from "$lib/favcrm";
  import { authStore } from "$lib/stores/auth";
  import { formatMoney } from "$lib/format";
  import { COUNTRIES } from "$lib/countries";
  import Button from "$lib/components/site/Button.svelte";
  import Eyebrow from "$lib/components/site/Eyebrow.svelte";
  import Field from "$lib/components/site/Field.svelte";
  import PageHeader from "$lib/components/site/PageHeader.svelte";
  import SelectField from "$lib/components/site/SelectField.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let form = $state<CheckoutFormFields>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    country: "",
  });

  let stateRegion = $state("");
  let zipCode = $state("");
  let shippingMethodId = $state<number | null>(null);
  let paymentMethodId = $state<string>("");
  let promotionInput = $state("");
  let appliedCoupon = $state<AppliedCoupon | null>(null);
  let couponError = $state<string | null>(null);
  let couponBusy = $state(false);
  let submitting = $state(false);
  let errorMsg = $state<string | null>(null);
  let mounted = $state(false);

  const subtotalValue = $derived($cartSubtotal);

  const eligibility = $derived<ShippingEligibility[]>(
    computeShippingEligibility(data.shipping, subtotalValue),
  );

  const selectedShipping = $derived(
    eligibility.find((e) => e.method.id === shippingMethodId) ?? null,
  );

  const shippingCost = $derived(
    selectedShipping ? selectedShipping.effectiveCost : 0,
  );

  const discountAmount = $derived(appliedCoupon?.discountAmount ?? 0);

  const finalTotal = $derived(
    calculateFinalTotal(subtotalValue, discountAmount, shippingCost),
  );

  const hasShippingOptions = $derived(data.shipping.length > 0);
  const hasPaymentOptions = $derived(data.payment.length > 0);

  $effect(() => {
    if (
      appliedCoupon &&
      Math.abs(appliedCoupon.originalPrice - subtotalValue) > 0.01
    ) {
      revalidateCoupon();
    }
  });

  onMount(async () => {
    mounted = true;

    if ($cart.length === 0) {
      goto("/cart", { replaceState: true });
      return;
    }

    if (shippingMethodId === null) {
      shippingMethodId = pickDefaultShippingId(eligibility);
    }
    if (!paymentMethodId && hasPaymentOptions) {
      paymentMethodId = data.payment[0]!.id;
    }

    if ($authStore.jwt) {
      try {
        const sdk = createFavCRM();
        const profile = await sdk.members.getProfile();
        if (!form.email && profile.email) form.email = profile.email;
        if (!form.phone && profile.phone) form.phone = profile.phone;
        if (!form.firstName && profile.name) {
          const parts = profile.name.trim().split(/\s+/);
          form.firstName = parts[0] ?? "";
          if (parts.length > 1) {
            form.lastName = parts.slice(1).join(" ");
          }
        }
      } catch {
        // non-fatal — user can fill manually
      }
    }
  });

  async function revalidateCoupon() {
    if (!appliedCoupon) return;
    const code = appliedCoupon.code;
    appliedCoupon = null;
    await applyCoupon(code, { silent: true });
  }

  async function applyCoupon(
    codeOverride?: string,
    { silent = false }: { silent?: boolean } = {},
  ) {
    const code = (codeOverride ?? promotionInput).trim();
    if (!code) {
      couponError = "Enter a promotion code.";
      return;
    }
    couponBusy = true;
    couponError = null;
    try {
      const sdk = createFavCRM();
      const result = await sdk.promotions.validate({
        promotionCode: code,
        channel: "online",
        amount: subtotalValue,
      });
      if (!result.isValid) {
        appliedCoupon = null;
        couponError = getCouponErrorMessage(
          result,
          {},
          result.errorMessage ?? "This promotion code can't be applied.",
        );
        return;
      }
      appliedCoupon = buildAppliedCoupon(code, result);
      promotionInput = code;
      if (!silent) {
        toasts.success(`Promotion "${code}" applied`);
      }
    } catch (err) {
      appliedCoupon = null;
      couponError =
        err instanceof Error ? err.message : "Couldn't validate that code.";
    } finally {
      couponBusy = false;
    }
  }

  function clearCoupon() {
    appliedCoupon = null;
    promotionInput = "";
    couponError = null;
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    errorMsg = null;

    const validation = validateCheckoutForm(form);
    if (validation) {
      errorMsg = validation;
      return;
    }

    if ($cart.length === 0) {
      errorMsg = "Your cart is empty.";
      return;
    }

    if (hasShippingOptions && shippingMethodId === null) {
      errorMsg = "Please choose a shipping method.";
      return;
    }

    if (hasPaymentOptions && !paymentMethodId) {
      errorMsg = "Please choose a payment method.";
      return;
    }

    submitting = true;
    try {
      const request = buildCreateOrderRequest(
        $cart,
        form,
        shippingMethodId,
        appliedCoupon?.code,
        paymentMethodId
          ? {
              paymentMethodId,
              successUrl: `${window.location.origin}/checkout/success`,
              cancelUrl: `${window.location.origin}/checkout`,
            }
          : undefined,
      );

      // Augment with state/zip — SDK helper doesn't include them.
      if (stateRegion.trim()) {
        request.shippingAddress.state = stateRegion.trim();
      }
      if (zipCode.trim()) {
        request.shippingAddress.zipCode = zipCode.trim();
      }

      const sdk = createFavCRM();
      const order = await sdk.shop.createOrder(request);
      cart.clear();

      if (order.paymentUrl) {
        // Hosted gateway — leave success toast for return-trip page.
        window.location.href = order.paymentUrl;
        return;
      }

      toasts.success(
        `Order ${order.orderNumber ?? order.orderId} confirmed`,
      );
      goto(`/checkout/success?order=${encodeURIComponent(order.orderId)}`);
    } catch (err) {
      errorMsg =
        err instanceof Error ? err.message : "Failed to place order.";
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Checkout</title>
</svelte:head>

<PageHeader eyebrow="Checkout" title="Place your order" />

<section class="site-section">
  <div class="site-container checkout-shell">
    {#if !mounted}
      <div class="checkout-skel" aria-hidden="true"></div>
    {:else if $cart.length === 0}
      <p class="checkout-empty">
        Your cart is empty. <a href="/shop">Browse the catalog</a>.
      </p>
    {:else}
      <form class="checkout-grid" onsubmit={submit}>
        <div class="checkout-form">
          <fieldset class="form-block">
            <legend>
              <Eyebrow>Contact</Eyebrow>
            </legend>
            <div class="form-row two">
              <Field
                label="First name"
                name="firstName"
                bind:value={form.firstName}
                required
                autocomplete="given-name"
              />
              <Field
                label="Last name"
                name="lastName"
                bind:value={form.lastName}
                required
                autocomplete="family-name"
              />
            </div>
            <div class="form-row two">
              <Field
                label="Email"
                name="email"
                type="email"
                bind:value={form.email}
                required
                autocomplete="email"
                inputmode="email"
              />
              <Field
                label="Phone"
                name="phone"
                type="tel"
                bind:value={form.phone}
                autocomplete="tel"
                inputmode="tel"
              />
            </div>
          </fieldset>

          <fieldset class="form-block">
            <legend>
              <Eyebrow>Shipping address</Eyebrow>
            </legend>
            <Field
              label="Address line 1"
              name="addressLine1"
              bind:value={form.addressLine1}
              required
              autocomplete="address-line1"
            />
            <Field
              label="Address line 2"
              name="addressLine2"
              bind:value={form.addressLine2}
              autocomplete="address-line2"
            />
            <div class="form-row three">
              <Field
                label="City"
                name="city"
                bind:value={form.city}
                required
                autocomplete="address-level2"
              />
              <Field
                label="State / Region"
                name="stateRegion"
                bind:value={stateRegion}
                autocomplete="address-level1"
              />
              <Field
                label="Postal code"
                name="zipCode"
                bind:value={zipCode}
                autocomplete="postal-code"
                inputmode="numeric"
              />
            </div>
            <SelectField
              label="Country"
              name="country"
              bind:value={form.country}
              options={COUNTRIES.map((c) => ({ value: c.name, label: c.name }))}
              placeholder="Select country"
              autocomplete="country-name"
            />
          </fieldset>

          <fieldset class="form-block">
            <legend>
              <Eyebrow>Shipping method</Eyebrow>
            </legend>
            {#if !hasShippingOptions}
              <p class="form-note">
                No shipping methods configured. Orders will be processed without
                a shipping option.
              </p>
            {:else}
              <div class="option-list">
                {#each eligibility as opt (opt.method.id)}
                  <label class="option-row" class:locked={opt.locked}>
                    <input
                      type="radio"
                      name="shipping"
                      value={opt.method.id}
                      disabled={opt.locked}
                      checked={shippingMethodId === opt.method.id}
                      onchange={() => (shippingMethodId = opt.method.id)}
                    />
                    <span class="option-body">
                      <span class="option-title">{opt.method.name}</span>
                      {#if opt.method.estimatedDays}
                        <span class="option-meta">{opt.method.estimatedDays}</span>
                      {/if}
                      {#if opt.locked && opt.amountToUnlock > 0}
                        <span class="option-meta">
                          Add {formatMoney(opt.amountToUnlock)} to unlock
                        </span>
                      {/if}
                    </span>
                    <span class="option-price">
                      {opt.effectiveCost === 0
                        ? "Free"
                        : formatMoney(opt.effectiveCost)}
                    </span>
                  </label>
                {/each}
              </div>
            {/if}
          </fieldset>

          <fieldset class="form-block">
            <legend>
              <Eyebrow>Payment</Eyebrow>
            </legend>
            {#if !hasPaymentOptions}
              <p class="form-note form-note--warn">
                No payment methods are configured. Add one in admin before
                placing live orders.
              </p>
            {:else}
              <div class="option-list">
                {#each data.payment as method (method.id)}
                  <label class="option-row">
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethodId === method.id}
                      onchange={() => (paymentMethodId = method.id)}
                    />
                    <span class="option-body">
                      <span class="option-title">{method.name}</span>
                      {#if method.instructions}
                        <span class="option-meta">{method.instructions}</span>
                      {/if}
                    </span>
                  </label>
                {/each}
              </div>
            {/if}
          </fieldset>

          <fieldset class="form-block">
            <legend>
              <Eyebrow>Promotion code</Eyebrow>
            </legend>
            {#if appliedCoupon}
              <div class="coupon-applied">
                <span class="coupon-applied-tag">
                  <Tag size={13} strokeWidth={1.7} />
                  {appliedCoupon.code}
                </span>
                <span class="coupon-applied-msg">
                  Saving {formatMoney(appliedCoupon.discountAmount)}
                </span>
                <button
                  type="button"
                  class="coupon-applied-remove"
                  onclick={clearCoupon}
                  aria-label="Remove promotion"
                >
                  <X size={14} strokeWidth={1.8} />
                </button>
              </div>
            {:else}
              <div class="coupon-row">
                <input
                  type="text"
                  class="field-input coupon-input"
                  bind:value={promotionInput}
                  placeholder="Enter code"
                  autocomplete="off"
                  aria-label="Promotion code"
                  onkeydown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void applyCoupon();
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  onclick={() => void applyCoupon()}
                  disabled={couponBusy || !promotionInput.trim()}
                >
                  {couponBusy ? "Checking…" : "Apply"}
                </Button>
              </div>
              {#if couponError}
                <p class="form-error">{couponError}</p>
              {/if}
            {/if}
          </fieldset>

          {#if errorMsg}
            <p class="checkout-error" role="alert">{errorMsg}</p>
          {/if}
        </div>

        <aside class="checkout-summary" aria-label="Order summary">
          <Eyebrow>Order</Eyebrow>
          <h2 class="checkout-summary-title">Review</h2>
          <ul class="checkout-items">
            {#each $cart as item (item.product.id + ":" + (item.variationId ?? 0))}
              <li>
                <span class="checkout-items-name">
                  {item.product.name}
                  {#if item.variationName}
                    <span class="checkout-items-variant">
                      ({item.variationName})
                    </span>
                  {/if}
                  <span class="checkout-items-qty">× {item.quantity}</span>
                </span>
                <span class="checkout-items-price">
                  {formatMoney((item.product.price ?? 0) * item.quantity)}
                </span>
              </li>
            {/each}
          </ul>
          <dl class="checkout-rows">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(subtotalValue)}</dd>
            </div>
            {#if discountAmount > 0}
              <div>
                <dt>Discount</dt>
                <dd class="discount">−{formatMoney(discountAmount)}</dd>
              </div>
            {/if}
            <div>
              <dt>Shipping</dt>
              <dd>
                {shippingCost === 0 && selectedShipping
                  ? "Free"
                  : formatMoney(shippingCost)}
              </dd>
            </div>
          </dl>
          <div class="checkout-total">
            <span>Total</span>
            <span class="checkout-total-amount">{formatMoney(finalTotal)}</span>
          </div>
          <Button type="submit" size="lg" disabled={submitting}>
            <Lock size={15} strokeWidth={1.7} />
            {submitting ? "Placing order…" : "Place order"}
          </Button>
          <Button href="/cart" variant="ghost">
            <ArrowLeft size={15} strokeWidth={1.7} />
            Back to cart
          </Button>
        </aside>
      </form>
    {/if}
  </div>
</section>

<style>
  .checkout-shell {
    padding-top: 8px;
    padding-bottom: 64px;
  }
  .checkout-empty {
    color: var(--muted, #6b6b6b);
  }
  .checkout-empty a {
    color: var(--ink, #111);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .checkout-skel {
    min-height: 360px;
    border-radius: 12px;
    background: linear-gradient(90deg, #fff 0%, #f3f4f6 50%, #fff 100%);
    background-size: 200% 100%;
    animation: shimmer 1.2s linear infinite;
  }
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  .checkout-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 32px;
  }
  @media (min-width: 960px) {
    .checkout-grid {
      grid-template-columns: minmax(0, 1fr) 340px;
      gap: 48px;
      align-items: start;
    }
  }
  .checkout-form {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .form-block {
    border: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .form-block legend {
    padding: 0;
    margin-bottom: 4px;
  }
  .form-row.two,
  .form-row.three {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }
  @media (min-width: 640px) {
    .form-row.two {
      grid-template-columns: 1fr 1fr;
    }
    .form-row.three {
      grid-template-columns: 2fr 1fr 1fr;
    }
  }
  .form-note {
    margin: 0;
    padding: 12px 14px;
    background: #f9fafb;
    border: 1px solid var(--line, #e6e4de);
    border-radius: 8px;
    color: var(--muted, #6b6b6b);
    font-size: 13px;
  }
  .form-note--warn {
    background: #fffbeb;
    border-color: #fde68a;
    color: #92400e;
  }
  .form-error {
    margin: 6px 0 0;
    font-size: 13px;
    color: #b91c1c;
  }
  .option-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .option-row {
    display: grid;
    grid-template-columns: 18px 1fr auto;
    gap: 14px;
    align-items: center;
    padding: 14px 16px;
    border: 1px solid var(--line, #e6e4de);
    border-radius: 10px;
    cursor: pointer;
    transition: border-color 120ms, background 120ms;
  }
  .option-row:hover {
    border-color: var(--ink, #111);
  }
  .option-row.locked {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .option-row input[type="radio"] {
    width: 16px;
    height: 16px;
    accent-color: var(--accent, #1e3a8a);
  }
  .option-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .option-title {
    font-weight: 500;
    color: var(--ink, #111);
  }
  .option-meta {
    font-size: 12px;
    color: var(--muted, #6b6b6b);
  }
  .option-price {
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }
  .coupon-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
  }
  .coupon-input {
    width: 100%;
  }
  .coupon-applied {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    border-radius: 8px;
  }
  .coupon-applied-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    color: #065f46;
    font-size: 13px;
  }
  .coupon-applied-msg {
    flex: 1;
    color: #047857;
    font-size: 13px;
  }
  .coupon-applied-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    color: #047857;
    transition: color 120ms, background 120ms;
  }
  .coupon-applied-remove:hover {
    color: #065f46;
    background: #d1fae5;
  }
  .checkout-error {
    margin: 0;
    padding: 12px 14px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #991b1b;
    font-size: 14px;
  }
  .checkout-summary {
    background: var(--surface, #fff);
    border: 1px solid var(--line, #e6e4de);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: sticky;
    top: 96px;
  }
  .checkout-summary-title {
    font-family: var(--font-display, Georgia, serif);
    font-size: 24px;
    margin: 0;
    line-height: 1.1;
  }
  .checkout-items {
    list-style: none;
    padding: 0;
    margin: 8px 0 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 220px;
    overflow-y: auto;
    border-bottom: 1px solid var(--line, #e6e4de);
    padding-bottom: 12px;
  }
  .checkout-items li {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    font-size: 13px;
  }
  .checkout-items-name {
    flex: 1;
    color: var(--ink, #111);
  }
  .checkout-items-variant {
    color: var(--muted, #6b6b6b);
    margin-left: 2px;
  }
  .checkout-items-qty {
    color: var(--muted, #6b6b6b);
    margin-left: 4px;
  }
  .checkout-items-price {
    font-variant-numeric: tabular-nums;
    color: var(--ink, #111);
  }
  .checkout-rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
  }
  .checkout-rows div {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
  }
  .checkout-rows dt {
    color: var(--muted, #6b6b6b);
  }
  .checkout-rows dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }
  .checkout-rows .discount {
    color: #047857;
  }
  .checkout-total {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-top: 12px;
    border-top: 1px solid var(--line, #e6e4de);
    margin-bottom: 4px;
  }
  .checkout-total-amount {
    font-family: var(--font-display, Georgia, serif);
    font-size: 22px;
    font-variant-numeric: tabular-nums;
  }
</style>
