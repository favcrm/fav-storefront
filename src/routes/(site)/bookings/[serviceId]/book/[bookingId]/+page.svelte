<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import {
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    Check,
    Clock,
    CreditCard,
    Loader,
    Receipt,
  } from "lucide-svelte";
  import type { BookingDetail } from "@favcrm/sdk";
  import { authStore } from "$lib/stores/auth";
  import { createFavCRM } from "$lib/favcrm";
  import { formatMoney } from "$lib/format";
  import Button from "$lib/components/site/Button.svelte";
  import Eyebrow from "$lib/components/site/Eyebrow.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let booking = $state<BookingDetail | null>(null);
  let qrContent = $state<string | null>(null);
  let loadError = $state<string | null>(null);
  let loaded = $state(false);

  const paymentStatus = $derived(
    $page.url.searchParams.get("redirect_status") ??
      $page.url.searchParams.get("payment"),
  );
  const showPaymentBanner = $derived(
    paymentStatus === "succeeded" ||
      paymentStatus === "processing" ||
      paymentStatus === "failed" ||
      paymentStatus === "requires_payment_method",
  );

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
      year: "numeric",
    });
  }

  async function load() {
    if (!$authStore.jwt) {
      loadError = "Sign in to view this booking.";
      loaded = true;
      return;
    }
    try {
      const sdk = createFavCRM();
      sdk.setToken($authStore.jwt);
      booking = await sdk.bookings.get(data.bookingId);
      try {
        const qr = await sdk.bookings.getAccessQr(data.bookingId);
        qrContent = qr.qrContent;
      } catch {
        qrContent = null;
      }
    } catch (err) {
      loadError = err instanceof Error ? err.message : "Unable to load booking";
    } finally {
      loaded = true;
    }
  }

  onMount(load);
</script>

<section class="site-container success-shell">
  <div class="success-card">
    <span class="success-mark">
      <Check size={26} strokeWidth={2.2} />
    </span>
    <Eyebrow>Confirmed</Eyebrow>
    <h1 class="site-h1">Your booking is reserved</h1>
    <p class="site-lead">
      We've saved a slot for you. Details below.
    </p>

    {#if showPaymentBanner}
      <div class="payment-banner payment-banner--{paymentStatus}">
        {#if paymentStatus === "succeeded"}
          <Check size={16} strokeWidth={2} />
          <span>Payment received. Your booking is confirmed.</span>
        {:else if paymentStatus === "processing"}
          <Loader size={16} strokeWidth={1.8} />
          <span>Payment processing. We'll update the booking shortly.</span>
        {:else}
          <AlertTriangle size={16} strokeWidth={1.8} />
          <span>Payment did not complete.</span>
          <a
            class="payment-banner-link"
            href="/bookings/{data.serviceId}/book/{data.bookingId}/pay"
          >
            <CreditCard size={12} strokeWidth={1.8} />
            Try again
          </a>
        {/if}
      </div>
    {/if}

    {#if loadError}
      <p class="form-note form-note--warn">{loadError}</p>
      <Button href="/bookings" variant="ghost">
        <ArrowLeft size={16} strokeWidth={1.8} />
        Back to services
      </Button>
    {:else if !loaded}
      <div class="success-skeleton">
        {#each Array(4) as _}
          <span class="skeleton-row"></span>
        {/each}
      </div>
    {:else if booking}
      <dl class="success-rows">
        <div>
          <dt>Service</dt>
          <dd>{booking.serviceName}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <span class="status-pill status-pill--{booking.status}">
              {booking.status}
            </span>
          </dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{formatDateLong(booking.bookingDate)}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>
            <Clock size={12} strokeWidth={1.6} />
            {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
          </dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd class="success-total">
            {formatMoney(Number(booking.totalPrice) || 0)}
          </dd>
        </div>
        {#if booking.notes}
          <div>
            <dt>Notes</dt>
            <dd>{booking.notes}</dd>
          </div>
        {/if}
      </dl>

      {#if booking.lineItems && booking.lineItems.length > 1}
        <div class="success-block">
          <Eyebrow>Items</Eyebrow>
          <ul class="success-items">
            {#each booking.lineItems as line (line.id)}
              <li>
                <span>{line.name}</span>
                <span>{formatMoney(Number(line.price) || 0)}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if qrContent}
        <div class="success-block">
          <Eyebrow>Check-in code</Eyebrow>
          <div class="qr-block">
            <span class="qr-mark">
              <Receipt size={20} strokeWidth={1.6} />
            </span>
            <code>{qrContent}</code>
          </div>
        </div>
      {/if}

      <div class="success-actions">
        {#if booking.status === "pending" && Number(booking.totalPrice) > 0 && paymentStatus !== "succeeded"}
          <Button
            href="/bookings/{data.serviceId}/book/{booking.id}/pay"
            size="lg"
          >
            <CreditCard size={16} strokeWidth={1.8} />
            Pay {formatMoney(Number(booking.totalPrice))}
          </Button>
          <Button href="/member/bookings" variant="ghost">
            <CalendarDays size={16} strokeWidth={1.8} />
            My bookings
          </Button>
        {:else}
          <Button href="/member/bookings" size="lg">
            <CalendarDays size={16} strokeWidth={1.8} />
            My bookings
          </Button>
          <Button href="/bookings" variant="ghost">
            <ArrowLeft size={16} strokeWidth={1.8} />
            Browse more
          </Button>
        {/if}
      </div>
    {/if}
  </div>
</section>

<style>
  .success-shell {
    padding: clamp(40px, 5vw, 80px) clamp(16px, 4vw, 32px);
    display: grid;
    place-items: center;
  }
  .success-card {
    max-width: 640px;
    width: 100%;
    display: grid;
    gap: 14px;
    padding: clamp(28px, 4vw, 48px);
    background: var(--surface, #fff);
    border: 1px solid var(--line, #e6e4de);
    border-radius: var(--radius-card, 10px);
    text-align: left;
  }
  .success-mark {
    width: 56px;
    height: 56px;
    display: grid;
    place-items: center;
    background: #ecfdf5;
    color: #047857;
    border-radius: 999px;
  }
  .payment-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
  }
  .payment-banner--succeeded {
    background: #d1fae5;
    color: #065f46;
  }
  .payment-banner--processing {
    background: #fef3c7;
    color: #92400e;
  }
  .payment-banner--failed,
  .payment-banner--requires_payment_method {
    background: #fee2e2;
    color: #991b1b;
  }
  .payment-banner-link {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: inherit;
    font-weight: 600;
    text-decoration: underline;
  }
  .success-rows {
    display: grid;
    gap: 12px;
    margin: 8px 0 0;
    padding-top: 16px;
    border-top: 1px solid var(--line, #e6e4de);
  }
  .success-rows div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: baseline;
  }
  .success-rows dt {
    color: var(--muted, #6b6b6b);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 11px;
    font-weight: 600;
  }
  .success-rows dd {
    margin: 0;
    text-align: right;
    font-size: 14px;
    color: var(--ink, #111);
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .success-total {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-variant-numeric: tabular-nums;
  }
  .status-pill {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: capitalize;
    background: var(--accent-soft, #eef2ff);
    color: var(--accent, #1e3a8a);
  }
  .status-pill--confirmed {
    background: #d1fae5;
    color: #065f46;
  }
  .status-pill--pending {
    background: #fef3c7;
    color: #92400e;
  }
  .status-pill--cancelled,
  .status-pill--no_show {
    background: #fee2e2;
    color: #991b1b;
  }
  .success-block {
    display: grid;
    gap: 10px;
    margin-top: 8px;
  }
  .success-items {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 6px;
  }
  .success-items li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    color: var(--ink-soft, #2a2a2a);
  }
  .qr-block {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--paper, #fafaf7);
    border: 1px dashed var(--line, #e6e4de);
    border-radius: 8px;
  }
  .qr-block code {
    font-family: var(--font-mono);
    font-size: 12px;
    word-break: break-all;
    color: var(--ink, #111);
  }
  .qr-mark {
    color: var(--accent, #1e3a8a);
  }
  .success-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 12px;
  }
  .success-skeleton {
    display: grid;
    gap: 10px;
    padding-top: 12px;
  }
  .skeleton-row {
    height: 14px;
    background: var(--line, #e6e4de);
    border-radius: 4px;
    animation: shimmer 1.4s linear infinite;
  }
  .skeleton-row:nth-child(2) {
    width: 80%;
  }
  .skeleton-row:nth-child(3) {
    width: 70%;
  }
  .skeleton-row:nth-child(4) {
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
</style>
