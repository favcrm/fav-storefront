<script lang="ts">
  import { CalendarDays, MapPin, AlertCircle, Loader2, ArrowRight, CheckCircle2 } from "lucide-svelte";
  import type { PageData } from "./$types";
  import { formatEventDate, formatEventPrice, getDeliveryModeLabel } from "@favcrm/sdk";
  import { authStore } from "$lib/stores/auth";
  import { createFavCRM } from "$lib/favcrm";
  import Button from "$lib/components/site/Button.svelte";
  
  let { data }: { data: PageData } = $props();
  const event = $derived(data.event as any);
  
  const formattedDate = $derived(formatEventDate(event.dates));
  const formattedPrice = $derived(formatEventPrice(event));
  const deliveryLabel = $derived(getDeliveryModeLabel(event.deliveryMode));
  
  // Registration Form State
  let submitting = $state(false);
  let regError = $state("");
  let successResult = $state<any>(null);
  
  // Form Fields
  let guestName = $state("");
  let email = $state("");
  let phone = $state("");
  let quantity = $state(1);
  let selectedSessionId = $state<string>("");
  
  // Pre-fill if logged in
  $effect(() => {
    if ($authStore.jwt && !guestName) {
      guestName = $authStore.memberName ?? "";
      phone = $authStore.phone ?? "";
    }
  });
  
  // Set default session
  $effect(() => {
    if (event.dates && event.dates.length > 0 && !selectedSessionId) {
      const availableSession = event.dates.find((d: any) => d.available);
      selectedSessionId = availableSession ? (availableSession.id ?? "") : (event.dates[0].id ?? "");
    }
  });

  const availableQuantity = $derived.by(() => {
    const maxOrder = event.maxTicketsPerOrder || 10;
    if (!event.dates) return maxOrder;
    const session = event.dates.find((d: any) => d.id === selectedSessionId);
    if (!session || session.remainingQuota === null) return maxOrder;
    return Math.min(maxOrder, session.remainingQuota);
  });

  async function handleRegister(e: SubmitEvent) {
    e.preventDefault();
    if (!guestName || !email || !selectedSessionId) return;
    
    submitting = true;
    regError = "";
    
    try {
      const sdk = createFavCRM();
      const result = await sdk.events.register({
        eventSlug: event.slug,
        guestName,
        email,
        phone,
        quantity,
        sessionId: selectedSessionId,
      });
      successResult = result;
    } catch (err: any) {
      regError = err.message || "Registration failed. Please try again.";
    } finally {
      submitting = false;
    }
  }
</script>

<div class="site-container">
  <div class="event-layout">
    <!-- Left Column: Story & Details -->
    <div class="event-story">
      <header class="event-header">
        <div class="event-flags">
          {#if deliveryLabel}
            <span class="flag flag-delivery">{deliveryLabel}</span>
          {/if}
          {#if event.status === 'ongoing'}
            <span class="flag flag-status">Ongoing</span>
          {/if}
        </div>
        
        <h1 class="event-title">{event.title}</h1>
        
        <div class="event-quick-meta">
          {#if formattedDate}
            <div class="meta-row">
              <span class="meta-icon"><CalendarDays size={18} strokeWidth={1.5} /></span>
              <span class="meta-text">{formattedDate}</span>
            </div>
          {/if}
          {#if event.location}
            <div class="meta-row">
              <span class="meta-icon"><MapPin size={18} strokeWidth={1.5} /></span>
              <span class="meta-text">{event.location}</span>
            </div>
          {/if}
        </div>
      </header>

      {#if event.imageUrl}
        <figure class="event-hero-image">
          <img src={event.imageUrl} alt={event.title} />
        </figure>
      {/if}
      
      <div class="event-description rich-text prose prose-slate max-w-none">
        {#if event.description}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html event.description}
        {:else}
          <p class="text-gray-500 italic">No description provided for this event.</p>
        {/if}
      </div>
    </div>

    <!-- Right Column: Registration Panel -->
    <div class="event-sidebar">
      <div class="registration-panel">
        <div class="panel-header">
          <div class="price-display">
            <span class="price-amount">{formattedPrice}</span>
            <span class="price-label">per ticket</span>
          </div>
          
          <div class="availability-badge">
            {#if event.remainingQuota === 0}
              <span class="status-out">Sold Out</span>
            {:else if event.remainingQuota !== null && event.remainingQuota <= 5}
              <span class="status-low">Only {event.remainingQuota} left</span>
            {:else}
              <span class="status-ok">Available</span>
            {/if}
          </div>
        </div>

        <div class="panel-body">
          {#if successResult}
            <div class="success-state animate-in fade-in zoom-in duration-500">
              <div class="success-icon">
                <CheckCircle2 size={32} />
              </div>
              <h3 class="success-title">You're on the list!</h3>
              <p class="success-desc">
                We've sent a confirmation email to <strong>{email}</strong>. 
                Your tickets are secured.
              </p>
              <a href="/member/events" class="btn-site btn-site--primary w-full">
                View My Tickets <ArrowRight size={16} class="ml-2" />
              </a>
            </div>
          {:else if event.status === 'past'}
            <div class="ended-state">
              <p>This event has already ended.</p>
            </div>
          {:else if event.remainingQuota === 0}
            <div class="ended-state">
              <p>All tickets have been claimed.</p>
            </div>
          {:else}
            <form onsubmit={handleRegister} class="registration-form">
              <div class="form-section-title">Registration Details</div>
              
              {#if event.dates.length > 1}
                <div class="field-group">
                  <label for="session" class="elegant-label">Select Session</label>
                  <div class="select-wrapper">
                    <select id="session" bind:value={selectedSessionId} class="elegant-input" required>
                      <option value="" disabled>Choose a date & time</option>
                      {#each event.dates as session}
                        <option value={session.id} disabled={!session.available}>
                          {formatEventDate([session] as any)} 
                          {!session.available ? '(Unavailable)' : ''}
                        </option>
                      {/each}
                    </select>
                  </div>
                </div>
              {/if}
              
              <div class="field-group">
                <label for="guestName" class="elegant-label">Full Name</label>
                <input type="text" id="guestName" bind:value={guestName} class="elegant-input" required placeholder="Jane Doe" />
              </div>
              
              <div class="field-group">
                <label for="email" class="elegant-label">Email Address</label>
                <input type="email" id="email" bind:value={email} class="elegant-input" required placeholder="jane@example.com" />
              </div>
              
              <div class="grid-2-col">
                <div class="field-group">
                  <label for="phone" class="elegant-label">Phone</label>
                  <input type="tel" id="phone" bind:value={phone} class="elegant-input" placeholder="+1 234 567 8900" />
                </div>
                
                <div class="field-group">
                  <label for="quantity" class="elegant-label">Quantity</label>
                  <div class="select-wrapper">
                    <select id="quantity" bind:value={quantity} class="elegant-input" required>
                      {#each Array(availableQuantity) as _, i}
                        <option value={i + 1}>{i + 1}</option>
                      {/each}
                    </select>
                  </div>
                </div>
              </div>
              
              {#if regError}
                <div class="error-banner">
                  <AlertCircle size={16} strokeWidth={2} />
                  <span>{regError}</span>
                </div>
              {/if}
              
              <Button 
                type="submit" 
                size="lg"
                disabled={submitting || !selectedSessionId}
                class="w-full h-[56px] text-base"
              >
                {#if submitting}
                  <Loader2 class="w-5 h-5 animate-spin mx-auto" />
                {:else}
                  <span>Confirm Registration</span>
                  <ArrowRight size={18} />
                {/if}
              </Button>
            </form>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Base Layout */
  .event-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
    gap: clamp(32px, 5vw, 64px);
    align-items: start;
    padding: clamp(40px, 7vw, 80px) 0;
  }

  @media (max-width: 900px) {
    .event-layout {
      grid-template-columns: 1fr;
    }
  }

  /* Left Column: Story */
  .event-story {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .event-header {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 24px;
  }

  .event-flags {
    display: flex;
    gap: 8px;
  }

  .flag {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .flag-delivery {
    background: var(--ink);
    color: var(--paper, #fff);
  }

  .flag-status {
    background: #10b981;
    color: white;
  }

  .event-title {
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 4vw, 3.5rem);
    line-height: 1.1;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--ink, #111);
    margin: 0;
  }

  .event-quick-meta {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 8px;
    border-top: 1px solid var(--line, #e5e7eb);
  }

  .meta-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    color: var(--ink-soft, #2a2a2a);
    font-size: 1.05rem;
  }

  .meta-icon {
    color: var(--muted, #6b6b6b);
    margin-top: 2px;
  }

  .event-hero-image {
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 16px;
    overflow: hidden;
    margin: 0 0 40px 0;
    background: #f3f4f6;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  }

  .event-hero-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .event-description {
    font-size: 1.1rem;
    line-height: 1.7;
    color: var(--ink-soft, #2a2a2a);
  }

  /* Right Column: Panel */
  .event-sidebar {
    position: sticky;
    top: clamp(24px, 4vw, 40px);
  }

  .registration-panel {
    background: var(--surface, #ffffff);
    border: 1px solid var(--line, #e5e7eb);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 12px 40px rgba(17, 17, 17, 0.06), 0 1px 3px rgba(17, 17, 17, 0.03);
  }

  .panel-header {
    background: #f8f7f4;
    padding: 32px;
    border-bottom: 1px solid var(--line, #e5e7eb);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .price-display {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .price-amount {
    font-family: var(--font-mono);
    font-size: 2.25rem;
    font-weight: 600;
    line-height: 1;
    color: var(--ink, #111);
    letter-spacing: -0.02em;
  }

  .price-label {
    font-size: 0.85rem;
    color: var(--muted, #6b6b6b);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .availability-badge {
    margin-top: 8px;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .status-out { color: #dc2626; font-weight: 600; }
  .status-low { color: #d97706; font-weight: 600; }
  .status-ok  { color: #059669; }

  .panel-body {
    padding: 32px;
  }

  /* Form Styles */
  .registration-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-section-title {
    font-family: var(--font-sans);
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink, #111);
    margin-bottom: 8px;
    border-bottom: 2px solid var(--ink, #111);
    padding-bottom: 12px;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .grid-2-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .elegant-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink-soft, #2a2a2a);
  }

  .elegant-input {
    width: 100%;
    height: 48px;
    padding: 0 16px;
    background: #ffffff;
    border: 1px solid var(--line, #e5e7eb);
    border-radius: 8px;
    font-size: 0.95rem;
    color: var(--ink, #111);
    transition: all 200ms ease;
    font-family: var(--font-sans);
  }

  .elegant-input:focus {
    outline: none;
    background: #fff;
    border-color: var(--ink, #111);
    box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.05);
  }

  .select-wrapper {
    position: relative;
  }

  .select-wrapper::after {
    content: "↓";
    font-family: system-ui;
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    font-size: 12px;
    font-weight: bold;
    color: var(--ink, #111);
  }

  select.elegant-input {
    appearance: none;
    padding-right: 40px;
  }

  .error-banner {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
    border-radius: 8px;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  /* Success & Ended States */
  .success-state {
    text-align: center;
    padding: 20px 0;
  }

  .success-icon {
    width: 64px;
    height: 64px;
    background: #d1fae5;
    color: #059669;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
  }

  .success-title {
    font-family: var(--font-display);
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--ink, #111);
    margin-bottom: 12px;
  }

  .success-desc {
    font-size: 1rem;
    line-height: 1.6;
    color: var(--ink-soft, #2a2a2a);
    margin-bottom: 32px;
  }

  .ended-state {
    padding: 40px 0;
    text-align: center;
    color: var(--muted, #6b6b6b);
    font-size: 1.1rem;
    font-weight: 500;
  }
</style>
