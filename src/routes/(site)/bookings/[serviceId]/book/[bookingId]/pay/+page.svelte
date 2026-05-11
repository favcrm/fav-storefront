<script lang="ts">
  import { onMount, tick } from "svelte";
  import { goto } from "$app/navigation";
  import {
    loadStripe,
    type Stripe,
    type StripeElements,
    type StripePaymentElement,
  } from "@stripe/stripe-js";
  import { ArrowLeft, CreditCard, Lock, ShieldCheck } from "lucide-svelte";
  import type { BookingDetail } from "@favcrm/sdk";
  import { authStore } from "$lib/stores/auth";
  import { createFavCRM } from "$lib/favcrm";
  import { formatMoney } from "$lib/format";
  import Button from "$lib/components/site/Button.svelte";
  import Eyebrow from "$lib/components/site/Eyebrow.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let booking = $state<BookingDetail | null>(null);
  let stripe: Stripe | null = null;
  let elements: StripeElements | null = null;
  let paymentElement: StripePaymentElement | null = null;
  let paymentMount: HTMLDivElement | null = $state(null);
  let initError = $state<string | null>(null);
  let confirmError = $state<string | null>(null);
  let initializing = $state(true);
  let submitting = $state(false);

  const amount = $derived(Number(booking?.totalPrice ?? 0));
  // const currency = $derived(booking?.currency ?? "HKD");

  function formatTime(value: string): string {
    const [h, m] = value.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return date.toLocaleTimeString("en", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  function formatDateLong(iso: string): string {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString("en", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  async function init() {
    if (!$authStore.jwt) {
      await goto(
        `/login?next=/bookings/${data.serviceId}/book/${data.bookingId}/pay`,
      );
      return;
    }
    try {
      const sdk = createFavCRM();
      sdk.setToken($authStore.jwt);

      booking = await sdk.bookings.get(data.bookingId);

      if (booking.status === "confirmed" || booking.status === "completed") {
        await goto(
          `/bookings/${data.serviceId}/book/${data.bookingId}?payment=succeeded`,
          { replaceState: true },
        );
        return;
      }
      if (booking.status === "cancelled" || booking.status === "no_show") {
        initError = "This booking is no longer active.";
        return;
      }

      const payAmount = Number(booking.totalPrice) || 0;
      if (payAmount <= 0) {
        await goto(
          `/bookings/${data.serviceId}/book/${data.bookingId}?payment=succeeded`,
          { replaceState: true },
        );
        return;
      }

      const [gateway, intent] = await Promise.all([
        sdk.payments.getGateway(),
        sdk.payments.createIntent({
          amount: payAmount,
          currency: booking.currency,
          bookingId: booking.id,
        }),
      ]);

      const stripeOptions = intent.stripeAccount
        ? { stripeAccount: intent.stripeAccount }
        : undefined;
      stripe = await loadStripe(
        intent.publishableKey ?? gateway.publishableKey,
        stripeOptions,
      );
      if (!stripe) throw new Error("Failed to load Stripe");

      elements = stripe.elements({
        clientSecret: intent.clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            fontFamily: '"Inter Tight", system-ui, sans-serif',
            colorPrimary: "#1e3a8a",
            colorText: "#111111",
            colorBackground: "#ffffff",
            borderRadius: "8px",
          },
        },
      });

      paymentElement = elements.create("payment", { layout: "tabs" });
      initializing = false;
      await tick();
      if (paymentMount) paymentElement.mount(paymentMount);
    } catch (err) {
      initError =
        err instanceof Error ? err.message : "Unable to initialize payment";
      initializing = false;
    }
  }

  async function submit() {
    if (!stripe || !elements || !booking || submitting) return;
    submitting = true;
    confirmError = null;
    const returnUrl = new URL(
      `/bookings/${data.serviceId}/book/${data.bookingId}`,
      window.location.origin,
    );
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl.toString() },
    });
    if (result.error) {
      confirmError = result.error.message ?? "Payment failed";
      submitting = false;
    }
  }

  onMount(() => {
    init();
  });
</script>

<section class="site-container pay-shell">
  <a class="back-link" href="/bookings/{data.serviceId}/book/{data.bookingId}">
    <ArrowLeft size={14} strokeWidth={1.7} />
    Back to booking
  </a>

  <div class="pay-grid">
    <div class="pay-form">
      <header>
        <Eyebrow>Payment</Eyebrow>
        <h1 class="site-h1">Complete your booking</h1>
        <p class="site-lead">
          Secure card payment processed by Stripe.
        </p>
      </header>

      <div class="pay-element-card">
        <div class="pay-element-heading">
          <CreditCard size={16} strokeWidth={1.7} />
          <span>Card details</span>
          <span class="pay-element-lock">
            <Lock size={11} strokeWidth={1.8} />
            Encrypted
          </span>
        </div>

        {#if initError}
          <p class="form-note form-note--warn">{initError}</p>
          <Button
            href="/bookings/{data.serviceId}/book/{data.bookingId}"
            variant="ghost"
          >
            Back to booking
          </Button>
        {:else if initializing}
          <div class="pay-skeleton">
            <span class="skeleton-row"></span>
            <span class="skeleton-row"></span>
            <span class="skeleton-row"></span>
          </div>
        {:else}
          <div class="pay-element-mount" bind:this={paymentMount}></div>
        {/if}

        {#if confirmError}
          <p class="form-note form-note--warn">{confirmError}</p>
        {/if}

        {#if !initError}
          <Button
            size="lg"
            onclick={submit}
            disabled={initializing || submitting || !!initError}
          >
            <ShieldCheck size={16} strokeWidth={1.8} />
            {submitting ? "Processing…" : `Pay ${formatMoney(amount)}`}
          </Button>
        {/if}
      </div>
    </div>

    <aside class="pay-summary">
      <Eyebrow>Booking</Eyebrow>
      {#if booking}
        <h2 class="pay-summary-title">{booking.serviceName}</h2>
        <dl>
          <div>
            <dt>Date</dt>
            <dd>{formatDateLong(booking.bookingDate)}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>
              {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <span class="status-pill status-pill--{booking.status}">
                {booking.status}
              </span>
            </dd>
          </div>
        </dl>
        <div class="pay-total">
          <span>Total</span>
          <span class="pay-total-amount">
            {formatMoney(amount)}
          </span>
        </div>
      {:else}
        <div class="pay-skeleton">
          <span class="skeleton-row"></span>
          <span class="skeleton-row"></span>
          <span class="skeleton-row"></span>
        </div>
      {/if}
    </aside>
  </div>
</section>

<style>
  .pay-shell {
    padding-top: clamp(20px, 3vw, 36px);
    padding-bottom: clamp(40px, 5vw, 72px);
  }
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted, #6b6b6b);
    margin-bottom: clamp(16px, 2vw, 28px);
  }
  .back-link:hover {
    color: var(--ink, #111);
  }
  .pay-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
    gap: clamp(24px, 3vw, 40px);
    align-items: start;
  }
  @media (max-width: 900px) {
    .pay-grid {
      grid-template-columns: 1fr;
    }
  }
  .pay-form {
    display: grid;
    gap: clamp(20px, 2.4vw, 32px);
  }
  .pay-form header {
    display: grid;
    gap: 8px;
  }
  .pay-element-card {
    display: grid;
    gap: 18px;
    padding: clamp(20px, 2.4vw, 32px);
    background: var(--surface, #fff);
    border: 1px solid var(--line, #e5e7eb);
    border-radius: var(--radius-card, 10px);
  }
  .pay-element-heading {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--line, #e5e7eb);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink, #111);
  }
  .pay-element-lock {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--muted, #6b6b6b);
    font-weight: 500;
    letter-spacing: 0.06em;
  }
  .pay-element-mount {
    min-height: 200px;
  }
  .pay-skeleton {
    display: grid;
    gap: 10px;
    padding: 6px 0;
  }
  .skeleton-row {
    height: 14px;
    background: var(--line, #e5e7eb);
    border-radius: 4px;
    animation: shimmer 1.4s linear infinite;
  }
  .skeleton-row:nth-child(2) {
    width: 80%;
  }
  .skeleton-row:nth-child(3) {
    width: 60%;
  }
  @keyframes shimmer {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  .pay-summary {
    position: sticky;
    top: calc(var(--header-height, 64px) + 16px);
    display: grid;
    gap: 14px;
    padding: clamp(20px, 2vw, 28px);
    background: var(--ink, #111);
    color: var(--paper, #ffffff);
    border-radius: var(--radius-card, 10px);
  }
  .pay-summary :global(.eyebrow) {
    color: rgba(255, 255, 255, 0.7);
  }
  .pay-summary-title {
    font-family: var(--font-display);
    font-size: 1.5rem;
    margin: 0;
    line-height: 1.2;
  }
  .pay-summary dl {
    display: grid;
    gap: 10px;
    margin: 8px 0 0;
    padding: 14px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }
  .pay-summary dl > div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    font-size: 13px;
  }
  .pay-summary dt {
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 11px;
  }
  .pay-summary dd {
    margin: 0;
    text-align: right;
  }
  .pay-total {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-top: 4px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.7);
  }
  .pay-total-amount {
    font-family: var(--font-display);
    font-size: 1.75rem;
    color: var(--paper, #ffffff);
    letter-spacing: -0.01em;
    text-transform: none;
  }
  .status-pill {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: capitalize;
    background: rgba(255, 255, 255, 0.16);
    color: var(--paper, #ffffff);
  }
  .status-pill--pending {
    background: #fef3c7;
    color: #92400e;
  }
  .status-pill--confirmed,
  .status-pill--completed {
    background: #d1fae5;
    color: #065f46;
  }
  .status-pill--cancelled,
  .status-pill--no_show {
    background: #fee2e2;
    color: #991b1b;
  }
</style>
