<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { ArrowLeft, Ticket } from "lucide-svelte";
  import { authStore } from "$lib/stores/auth";
  import { createFavCRM } from "$lib/favcrm";
  import { formatMoney } from "$lib/format";
  import Button from "$lib/components/site/Button.svelte";
  import EmptyState from "$lib/components/site/EmptyState.svelte";
  import Eyebrow from "$lib/components/site/Eyebrow.svelte";
  import PageHeader from "$lib/components/site/PageHeader.svelte";

  let registrations = $state<any[]>([]); // SDK types might be slightly off, using any[] for safety
  let loaded = $state(false);
  let errorMsg = $state<string | null>(null);

  function formatDateShort(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  async function load() {
    if (!$authStore.jwt) {
      await goto("/login?next=/member/events");
      return;
    }
    try {
      const sdk = createFavCRM();
      sdk.setToken($authStore.jwt);
      registrations = await sdk.events.listRegistrations();
    } catch (err) {
      errorMsg =
        err instanceof Error ? err.message : "Unable to load event registrations";
    } finally {
      loaded = true;
    }
  }

  onMount(load);
</script>

<PageHeader
  eyebrow="Member"
  title="My Events"
  lead="Your upcoming and past event tickets."
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
  {:else if registrations.length === 0}
    <EmptyState
      icon={Ticket}
      title="No event tickets yet"
      description="Register for an event to see your tickets here."
    />
    <div class="empty-cta">
      <Button href="/events" size="lg">Browse Events</Button>
    </div>
  {:else}
    <ul class="booking-list">
      {#each registrations as reg (reg.id)}
        <li>
          <div class="booking-row pointer-events-none">
            <span class="booking-row-date">
              <span class="booking-row-date-main">
                {reg.sessionStartTime ? formatDateShort(reg.sessionStartTime) : formatDateShort(reg.createdAt || reg.registeredAt || new Date().toISOString())}
              </span>
            </span>
            <span class="booking-row-body">
              <Eyebrow>{reg.eventTitle}</Eyebrow>
              <span class="booking-row-id">Ticket #{reg.id.slice(0, 8)}</span>
            </span>
            <span class="booking-row-status">
              <span class="status-pill status-pill--{reg.status}">
                {reg.status}
              </span>
              <span class="booking-row-price">
                {formatMoney(Number(reg.totalAmount) || 0)}
              </span>
            </span>
          </div>
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
    color: inherit;
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
  .status-pill--paid {
    background: #d1fae5;
    color: #065f46;
  }
  .status-pill--pending {
    background: #fef3c7;
    color: #92400e;
  }
  .status-pill--cancelled {
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
