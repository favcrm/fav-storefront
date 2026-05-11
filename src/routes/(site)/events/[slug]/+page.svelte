<script lang="ts">
  import { CalendarDays, MapPin, Ticket, AlertCircle, Loader2 } from "lucide-svelte";
  import type { PageData } from "./$types";
  import { formatEventDate, formatEventPrice, getDeliveryModeLabel, stripHtml } from "@favcrm/sdk";
  import { authStore } from "$lib/stores/auth";
  import { createFavCRM } from "$lib/favcrm";
  import { invalidateAll } from "$app/navigation";
  
  let { data }: { data: PageData } = $props();
  const event = $derived(data.event as any);
  
  const formattedDate = $derived(formatEventDate(event.dates));
  const formattedPrice = $derived(formatEventPrice(event));
  const deliveryLabel = $derived(getDeliveryModeLabel(event.deliveryMode));
  
  // Registration Form State
  let showRegistration = $state(false);
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

  const availableQuantity = $derived(() => {
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
      // Close after delay or show success inline
    } catch (err: any) {
      regError = err.message || "Registration failed. Please try again.";
    } finally {
      submitting = false;
    }
  }

</script>

<div class="site-container detail-shell">
  <!-- Left Column: Media & Content -->
  <div>
    <div class="detail-media mb-8">
      {#if event.imageUrl}
        <img src={event.imageUrl} alt={event.title} />
      {:else}
        <div class="w-full h-full flex items-center justify-center text-gray-400">
          <CalendarDays size={64} opacity={0.3} />
        </div>
      {/if}
    </div>
    
    <div class="rich-text">
      <h2 class="site-h2 mb-6">About this event</h2>
      {#if event.description}
        <!-- Safe render if it's HTML, but for now we render as text/html depending on format -->
        <!-- Fallback: using @html as content from favcrm is usually safe HTML -->
        <div class="prose prose-slate max-w-none">
          {@html event.description}
        </div>
      {:else}
        <p>No description provided.</p>
      {/if}
    </div>
  </div>

  <!-- Right Column: Sticky Sidebar -->
  <div class="detail-copy">
    <div>
      <div class="flex items-center gap-3 mb-4">
        {#if deliveryLabel}
          <span class="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">
            {deliveryLabel}
          </span>
        {/if}
        {#if event.status === 'ongoing'}
          <span class="px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
            Ongoing
          </span>
        {/if}
      </div>
      
      <h1 class="site-h2 mb-4">{event.title}</h1>
      
      <div class="price mb-6">{formattedPrice}</div>
      
      <div class="flex flex-col gap-4 text-gray-600 mb-8 border-y border-gray-100 py-6">
        {#if formattedDate}
          <div class="flex items-start gap-3">
            <CalendarDays size={20} class="text-gray-400 mt-0.5" />
            <div>
              <div class="font-medium text-gray-900">Date & Time</div>
              <div class="text-sm mt-0.5">{formattedDate}</div>
            </div>
          </div>
        {/if}
        {#if event.location}
          <div class="flex items-start gap-3 mt-2">
            <MapPin size={20} class="text-gray-400 mt-0.5" />
            <div>
              <div class="font-medium text-gray-900">Location</div>
              <div class="text-sm mt-0.5">{event.location}</div>
            </div>
          </div>
        {/if}
      </div>
      
      {#if successResult}
        <div class="bg-emerald-50 border border-emerald-100 p-6 rounded-xl text-center">
          <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket size={24} />
          </div>
          <h3 class="text-emerald-800 font-bold text-lg mb-2">Registration Confirmed!</h3>
          <p class="text-emerald-600 text-sm mb-6">
            We've sent the details to {email}.
          </p>
          <a href="/member/bookings" class="btn-site btn-site--primary w-full">
            View My Tickets
          </a>
        </div>
      {:else}
        <button 
          type="button"
          onclick={() => showRegistration = true}
          class="btn-site btn-site--primary btn-site--lg w-full"
          disabled={event.remainingQuota === 0 || event.status === 'past'}
        >
          {event.remainingQuota === 0 ? 'Sold Out' : 'Register Now'}
        </button>
        
        {#if event.remainingQuota !== null && event.remainingQuota > 0 && event.remainingQuota <= 10}
          <p class="text-center text-sm text-amber-600 font-medium mt-3">
            Only {event.remainingQuota} spots remaining!
          </p>
        {/if}
      {/if}
    </div>
  </div>
</div>

<!-- Registration Modal / Drawer -->
{#if showRegistration && !successResult}
  <div class="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm p-4 sm:p-0">
    <!-- Click outside to close -->
    <div role="button" tabindex="-1" aria-label="Close" onkeydown={(e) => e.key === "Escape" && !submitting && (showRegistration = false)} class="absolute inset-0" onclick={() => !submitting && (showRegistration = false)}></div>
    
    <div class="relative w-full max-w-md h-full sm:h-[100vh] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      <div class="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 class="text-xl font-bold text-gray-900">Register for Event</h2>
        <button 
          onclick={() => !submitting && (showRegistration = false)}
          class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          disabled={submitting}
        >
          ✕
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-6">
        <div class="mb-6 flex gap-4">
          {#if event.imageUrl}
            <img src={event.imageUrl} alt="" class="w-16 h-16 object-cover rounded-lg bg-gray-100" />
          {/if}
          <div>
            <h3 class="font-semibold text-gray-900 leading-tight">{event.title}</h3>
            <div class="text-sm text-gray-500 mt-1">{formattedPrice}</div>
          </div>
        </div>
        
        <form id="reg-form" onsubmit={handleRegister} class="space-y-5">
          <!-- Session Selection -->
          {#if event.dates.length > 1}
            <div class="field">
              <label class="field-label" for="session">Select Session</label>
              <select id="session" bind:value={selectedSessionId} class="form-select w-full h-11" required>
                <option value="" disabled>Choose a date & time</option>
                {#each event.dates as session}
                  <option 
                    value={session.id} 
                    disabled={!session.available}
                  >
                    {formatEventDate([session] as any)} 
                    {!session.available ? '(Unavailable)' : ''}
                  </option>
                {/each}
              </select>
            </div>
          {/if}
          
          <div class="field">
            <label class="field-label" for="guestName">Full Name</label>
            <input type="text" id="guestName" bind:value={guestName} class="field-input" required placeholder="Jane Doe" />
          </div>
          
          <div class="field">
            <label class="field-label" for="email">Email Address</label>
            <input type="email" id="email" bind:value={email} class="field-input" required placeholder="jane@example.com" />
          </div>
          
          <div class="field">
            <label class="field-label" for="phone">Phone Number (Optional)</label>
            <input type="tel" id="phone" bind:value={phone} class="field-input" placeholder="+1 234 567 8900" />
          </div>
          
          <div class="field">
            <label class="field-label" for="quantity">Quantity</label>
            <select id="quantity" bind:value={quantity} class="form-select w-full h-11" required>
              {#each Array(availableQuantity()) as _, i}
                <option value={i + 1}>{i + 1}</option>
              {/each}
            </select>
          </div>
          
          {#if regError}
            <div class="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex gap-2 items-start">
              <AlertCircle size={16} class="mt-0.5 flex-shrink-0" />
              <span>{regError}</span>
            </div>
          {/if}
        </form>
      </div>
      
      <div class="p-6 border-t border-gray-100 bg-gray-50">
        <button 
          form="reg-form"
          type="submit" 
          disabled={submitting || !selectedSessionId}
          class="btn-site btn-site--primary btn-site--lg w-full relative"
        >
          {#if submitting}
            <Loader2 class="w-5 h-5 animate-spin mx-auto" />
          {:else}
            Confirm Registration
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
