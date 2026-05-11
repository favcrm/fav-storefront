<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { ArrowLeft, CalendarDays, Clock } from "lucide-svelte";
  import type { Booking } from "@favcrm/sdk";
  import { authStore } from "$lib/stores/auth";
  import { createFavCRM } from "$lib/favcrm";
  import { formatMoney } from "$lib/format";
  import Button from "$lib/components/site/Button.svelte";
  import EmptyState from "$lib/components/site/EmptyState.svelte";
  import Eyebrow from "$lib/components/site/Eyebrow.svelte";
  import PageHeader from "$lib/components/site/PageHeader.svelte";

  let bookings = $state<Booking[]>([]);
  let loaded = $state(false);
  let errorMsg = $state<string | null>(null);

  function formatTime(value: string): string {
    const [h, m] = value.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return date.toLocaleTimeString("en", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  function formatDateShort(iso: string): string {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString("en", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  async function load() {
    if (!$authStore.jwt) {
      await goto("/login?next=/member/bookings");
      return;
    }
    try {
      const sdk = createFavCRM();
      sdk.setToken($authStore.jwt);
      bookings = await sdk.bookings.list();
    } catch (err) {
      errorMsg =
        err instanceof Error ? err.message : "Unable to load bookings";
    } finally {
      loaded = true;
    }
  }

  onMount(load);
</script>

<PageHeader
  eyebrow="Member"
  title="My bookings"
  lead="Your reserved services with FavCRM."
/>

<section class="site-container site-section site-section--tight">
  <div class="member-bookings-back">
    <a class="back-link" href="/member">
      <ArrowLeft size={14} strokeWidth={1.7} />
      Member portal
    </a>
  </div>

  {#if errorMsg}
    <p class="form-note form-note--warn">{errorMsg}</p>
  {:else if !loaded}
    <div class="booking-list">
      {#each Array(3) as _}
        <div class="booking-row booking-row--skeleton" aria-hidden="true">
          <span class="skeleton-line"></span>
          <span class="skeleton-line skeleton-line--sm"></span>
        </div>
      {/each}
    </div>
  {:else if bookings.length === 0}
    <EmptyState
      icon={CalendarDays}
      title="No bookings yet"
      description="Reserve a service to see it here."
    />
    <div class="empty-cta">
      <Button href="/bookings" size="lg">Browse services</Button>
    </div>
  {:else}
    <ul class="booking-list">
      {#each bookings as booking (booking.id)}
        <li>
          <a
            class="booking-row"
            href="/bookings/{booking.serviceId}/book/{booking.id}"
          >
            <span class="booking-row-date">
              <span class="booking-row-date-main">
                {formatDateShort(booking.bookingDate)}
              </span>
              <span class="booking-row-time">
                <Clock size={12} strokeWidth={1.6} />
                {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
              </span>
            </span>
            <span class="booking-row-body">
              <Eyebrow>{booking.serviceName}</Eyebrow>
              <span class="booking-row-id">#{booking.id.slice(0, 8)}</span>
            </span>
            <span class="booking-row-status">
              <span class="status-pill status-pill--{booking.status}">
                {booking.status}
              </span>
              <span class="booking-row-price">
                {formatMoney(Number(booking.totalPrice) || 0)}
              </span>
            </span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .member-bookings-back {
    margin-bottom: clamp(16px, 2vw, 24px);
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
  }
  .back-link:hover {
    color: var(--ink, #111);
  }
  .booking-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px;
  }
  .booking-row {
    display: grid;
    grid-template-columns: minmax(140px, 180px) minmax(0, 1fr) auto;
    gap: 16px;
    align-items: center;
    padding: 16px 18px;
    background: var(--surface, #fff);
    border: 1px solid var(--line, #e5e7eb);
    border-radius: var(--radius-card, 10px);
    text-decoration: none;
    color: inherit;
    transition: border-color 160ms, transform 160ms, box-shadow 160ms;
  }
  .booking-row:hover {
    border-color: var(--ink, #111);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgb(17 17 17 / 6%);
  }
  .booking-row--skeleton {
    pointer-events: none;
    height: 64px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
  }
  .skeleton-line {
    height: 10px;
    width: 70%;
    background: var(--line, #e5e7eb);
    border-radius: 4px;
  }
  .skeleton-line--sm {
    width: 40%;
  }
  .booking-row-date {
    display: grid;
    gap: 4px;
  }
  .booking-row-date-main {
    font-family: var(--font-display);
    font-size: 1rem;
    color: var(--ink, #111);
  }
  .booking-row-time {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--muted, #6b6b6b);
  }
  .booking-row-body {
    display: grid;
    gap: 4px;
  }
  .booking-row-id {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted, #6b6b6b);
  }
  .booking-row-status {
    display: grid;
    gap: 6px;
    justify-items: end;
    text-align: right;
  }
  .booking-row-price {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 13px;
    color: var(--ink, #111);
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
  .status-pill--confirmed,
  .status-pill--completed {
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
  .empty-cta {
    display: grid;
    place-items: center;
    margin-top: 18px;
  }
  @media (max-width: 640px) {
    .booking-row {
      grid-template-columns: 1fr;
    }
    .booking-row-status {
      justify-items: start;
      text-align: left;
    }
  }
</style>
