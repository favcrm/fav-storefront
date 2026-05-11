<script lang="ts">
  import { onMount } from 'svelte';
  import { adminSettingsApi, type AnalyticsConfig, type BookingConfig, type LoginChannelConfig } from '$lib/api/admin';
  import { seedDemoData, seedTotals, type SeedProgress } from '$lib/api/seed';
  import ConfirmDialog from '$lib/components/admin/ConfirmDialog.svelte';
  import {
    BarChart3, Tag, Globe, CheckCircle2, Circle, Loader2, Save,
    Sparkles, AlertCircle, Package, CalendarDays, Ticket, ShieldAlert, Key
  } from 'lucide-svelte';

  let config = $state<AnalyticsConfig>({ gtmId: null, ga4Id: null, metaPixelId: null });
  let bookingConfig = $state<BookingConfig>({ allowMemberCancellation: true, memberCancellationCutoffHours: null });
  let loginChannel = $state<LoginChannelConfig>({ channel: 'whatsapp' });
  let loading = $state(true);
  let saving = $state(false);
  let error = $state('');
  let success = $state(false);

  // Form fields
  let gtmId = $state('');
  let ga4Id = $state('');
  let metaPixelId = $state('');
  
  let allowMemberCancellation = $state(true);
  let cutoffHours = $state<string>('');
  let channel = $state<'whatsapp' | 'sms' | 'email'>('whatsapp');

  // Demo seed state
  let seedScope = $state({ products: true, services: true, events: true });
  let seeding = $state(false);
  let seedProgress = $state<SeedProgress | null>(null);
  let seedSummary = $state<string>('');
  let seedErrors = $state<string[]>([]);
  let seedConfirmOpen = $state(false);

  function requestSeed() {
    seedConfirmOpen = true;
  }

  async function runSeed() {
    seedConfirmOpen = false;
    seeding = true;
    seedSummary = '';
    seedErrors = [];
    seedProgress = null;
    try {
      const result = await seedDemoData(seedScope, (p) => {
        seedProgress = p;
      });
      const parts: string[] = [];
      if (result.categoriesCreated) parts.push(`${result.categoriesCreated} categories`);
      if (result.productsCreated) parts.push(`${result.productsCreated} products`);
      if (result.servicesCreated) parts.push(`${result.servicesCreated} services`);
      if (result.eventsCreated) parts.push(`${result.eventsCreated} events`);
      seedSummary = parts.length ? `Created ${parts.join(', ')}.` : 'Nothing created.';
      seedErrors = result.errors;
    } catch (err) {
      seedErrors = [err instanceof Error ? err.message : 'Seed failed'];
    } finally {
      seeding = false;
      seedProgress = null;
    }
  }

  onMount(async () => {
    try {
      const [analyticsRes, bookingRes, loginRes] = await Promise.all([
        adminSettingsApi.getAnalytics(),
        adminSettingsApi.getBookingConfig(),
        adminSettingsApi.getLoginChannel()
      ]);
      
      config = analyticsRes;
      gtmId = config.gtmId ?? '';
      ga4Id = config.ga4Id ?? '';
      metaPixelId = config.metaPixelId ?? '';
      
      bookingConfig = bookingRes;
      allowMemberCancellation = bookingConfig.allowMemberCancellation ?? true;
      cutoffHours = bookingConfig.memberCancellationCutoffHours?.toString() ?? '';
      
      loginChannel = loginRes;
      channel = loginChannel.channel ?? 'whatsapp';
    } catch {
      error = 'Failed to load settings';
    } finally {
      loading = false;
    }
  });

  async function handleSave() {
    saving = true;
    error = '';
    success = false;
    try {
      const [analyticsRes, bookingRes, loginRes] = await Promise.all([
        adminSettingsApi.updateAnalytics({
          gtmId: gtmId.trim() || null,
          ga4Id: ga4Id.trim() || null,
          metaPixelId: metaPixelId.trim() || null,
        }),
        adminSettingsApi.updateBookingConfig({
          allowMemberCancellation,
          memberCancellationCutoffHours: cutoffHours ? parseInt(cutoffHours, 10) : null,
        }),
        adminSettingsApi.updateLoginChannel({
          channel
        })
      ]);
      
      config = analyticsRes;
      bookingConfig = bookingRes;
      loginChannel = loginRes;
      
      success = true;
      setTimeout(() => { success = false; }, 3000);
    } catch {
      error = 'Failed to save settings';
    } finally {
      saving = false;
    }
  }
</script>

<div class="max-w-2xl">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center gap-3 mb-2">
      <div class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
        <BarChart3 class="w-4 h-4 text-slate-300" />
      </div>
      <h1 class="text-xl font-semibold text-gray-900">Analytics & Tracking</h1>
    </div>
    <p class="text-sm text-gray-500 ml-11">
      Connect GTM, GA4, and Meta Pixel to the member portal.
    </p>
  </div>

  {#if loading}
    <div class="flex items-center gap-3 py-12 text-gray-400">
      <Loader2 class="w-5 h-5 animate-spin" />
      <span class="text-sm">Loading…</span>
    </div>
  {:else}
    <!-- Status bar -->
    <div class="grid grid-cols-3 gap-3 mb-8">
      {#each [
        { label: 'GTM', value: config.gtmId, icon: Tag },
        { label: 'GA4', value: config.ga4Id, icon: BarChart3 },
        { label: 'Meta Pixel', value: config.metaPixelId, icon: Globe },
      ] as tracker}
        <div class="bg-white border border-gray-200 rounded-xl p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{tracker.label}</span>
            {#if tracker.value}
              <CheckCircle2 class="w-4 h-4 text-emerald-500" />
            {:else}
              <Circle class="w-4 h-4 text-gray-300" />
            {/if}
          </div>
          {#if tracker.value}
            <code class="text-xs font-mono text-gray-700 break-all">{tracker.value}</code>
          {:else}
            <span class="text-xs text-gray-400 italic">Not configured</span>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Form -->
    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 class="text-sm font-semibold text-gray-700">Authentication & Policies</h2>
      </div>

      <div class="p-6 space-y-6">
        <!-- Auth Channel -->
        <div>
          <label for="auth-channel" class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Customer Login Channel
          </label>
          <div class="flex items-center gap-3">
            <Key class="w-5 h-5 text-gray-400" />
            <select
              id="auth-channel"
              bind:value={channel}
              class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-400 transition-all"
            >
              <option value="whatsapp">WhatsApp OTP</option>
              <option value="sms">SMS OTP</option>
              <option value="email">Email OTP</option>
            </select>
          </div>
          <p class="mt-1.5 text-xs text-gray-400 ml-8">Choose how customers receive their one-time passwords.</p>
        </div>

        <hr class="border-gray-100" />

        <!-- Booking Policies -->
        <div class="space-y-4">
          <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Booking Policies
          </label>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <ShieldAlert class="w-5 h-5 text-gray-400" />
              <div>
                <p class="text-sm font-medium text-gray-900">Allow Member Cancellation</p>
                <p class="text-xs text-gray-500">Let customers cancel bookings via the portal</p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" bind:checked={allowMemberCancellation} class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {#if allowMemberCancellation}
            <div class="pl-8">
              <label for="cutoff-hours" class="block text-xs font-medium text-gray-700 mb-1">
                Cancellation Cutoff (Hours before start)
              </label>
              <input
                id="cutoff-hours"
                type="number"
                min="0"
                bind:value={cutoffHours}
                placeholder="e.g. 24"
                class="w-32 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-400 transition-all"
              />
              <p class="mt-1 text-xs text-gray-400">Leave blank for no cutoff.</p>
            </div>
          {/if}
        </div>
      </div>
      
      <div class="px-6 py-4 border-b border-t border-gray-100 bg-gray-50/50 mt-2">
        <h2 class="text-sm font-semibold text-gray-700">Tracking IDs</h2>
      </div>

      <div class="p-6 space-y-6">
        <!-- GTM -->
        <div>
          <label for="gtm-id" class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Google Tag Manager
          </label>
          <input
            id="gtm-id"
            type="text"
            bind:value={gtmId}
            placeholder="GTM-XXXXXXX"
            class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm font-mono text-gray-900 placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-400 transition-all"
          />
          <p class="mt-1.5 text-xs text-gray-400">Recommended — routes GA4 + other tags. Skip GA4 below when using GTM.</p>
        </div>

        <!-- GA4 -->
        <div>
          <label for="ga4-id" class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            GA4 Measurement ID
          </label>
          <input
            id="ga4-id"
            type="text"
            bind:value={ga4Id}
            placeholder="G-XXXXXXXXXX"
            class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm font-mono text-gray-900 placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-400 transition-all"
          />
          <p class="mt-1.5 text-xs text-gray-400">Direct GA4 only — leave blank if you are using GTM.</p>
        </div>

        <!-- Meta Pixel -->
        <div>
          <label for="pixel-id" class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Meta Pixel ID
          </label>
          <input
            id="pixel-id"
            type="text"
            bind:value={metaPixelId}
            placeholder="1234567890123456"
            class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm font-mono text-gray-900 placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-400 transition-all"
          />
          <p class="mt-1.5 text-xs text-gray-400">Facebook / Instagram Pixel — tracks PageView, Purchase, Lead.</p>
        </div>

        {#if error}
          <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>
        {/if}

        <!-- Actions -->
        <div class="flex items-center justify-between pt-2 border-t border-gray-100">
          <div class="flex items-center gap-2 text-sm text-emerald-600 transition-all duration-300"
               class:opacity-0={!success}
               class:opacity-100={success}>
            <CheckCircle2 class="w-4 h-4" />
            <span>Saved</span>
          </div>
          <button
            onclick={handleSave}
            disabled={saving}
            class="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed
                   text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            {#if saving}
              <Loader2 class="w-4 h-4 animate-spin" />
              Saving…
            {:else}
              <Save class="w-4 h-4" />
              Save Changes
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- Tracked events reference -->
    <div class="mt-6 bg-white border border-gray-200 rounded-xl p-5">
      <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tracked Events</h3>
      <div class="flex flex-wrap gap-2">
        {#each ['page_view', 'purchase', 'sign_up', 'login', 'booking_complete'] as evt}
          <code class="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md font-mono">{evt}</code>
        {/each}
      </div>
    </div>

    <!-- Demo data seeder -->
    <div class="mt-10 mb-4">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
          <Sparkles class="w-4 h-4 text-slate-300" />
        </div>
        <h2 class="text-xl font-semibold text-gray-900">Demo Data</h2>
      </div>
      <p class="text-sm text-gray-500 ml-11">
        Populate this workspace with sample catalog, services, and events so the storefront has something to render.
      </p>
    </div>

    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 class="text-sm font-semibold text-gray-700">Seed sample content</h3>
      </div>

      <div class="p-6 space-y-5">
        <div class="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Re-running creates duplicates. Use on a fresh workspace.</span>
        </div>

        <div class="grid grid-cols-3 gap-3">
          {#each [
            { key: 'products', label: 'Catalog', icon: Package, hint: `${seedTotals.categories} categories · ${seedTotals.products} products` },
            { key: 'services', label: 'Bookings', icon: CalendarDays, hint: `${seedTotals.services} services` },
            { key: 'events', label: 'Events', icon: Ticket, hint: `${seedTotals.events} events` },
          ] as opt}
            <label class="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-gray-300 transition-colors block">
              <input
                type="checkbox"
                bind:checked={seedScope[opt.key as 'products' | 'services' | 'events']}
                class="sr-only"
              />
              <div class="flex items-center justify-between mb-2">
                <span class="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <opt.icon class="w-3.5 h-3.5" />
                  {opt.label}
                </span>
                {#if seedScope[opt.key as 'products' | 'services' | 'events']}
                  <CheckCircle2 class="w-4 h-4 text-emerald-500" />
                {:else}
                  <Circle class="w-4 h-4 text-gray-300" />
                {/if}
              </div>
              <span class="text-xs text-gray-600">{opt.hint}</span>
            </label>
          {/each}
        </div>

        {#if seeding && seedProgress}
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>{seedProgress.step}</span>
              <span>{seedProgress.done} / {seedProgress.total}</span>
            </div>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-slate-800 transition-all"
                style:width={`${(seedProgress.done / Math.max(seedProgress.total, 1)) * 100}%`}
              ></div>
            </div>
          </div>
        {/if}

        {#if seedSummary}
          <div class="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <CheckCircle2 class="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{seedSummary}</span>
          </div>
        {/if}

        {#if seedErrors.length}
          <div class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 space-y-1">
            <div class="flex items-center gap-2 font-medium">
              <AlertCircle class="w-4 h-4" />
              <span>{seedErrors.length} item{seedErrors.length === 1 ? '' : 's'} failed</span>
            </div>
            <ul class="text-xs space-y-0.5 ml-6 list-disc">
              {#each seedErrors as err}
                <li>{err}</li>
              {/each}
            </ul>
          </div>
        {/if}

        <div class="flex justify-end pt-2 border-t border-gray-100">
          <button
            onclick={requestSeed}
            disabled={seeding || (!seedScope.products && !seedScope.services && !seedScope.events)}
            class="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed
                   text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            {#if seeding}
              <Loader2 class="w-4 h-4 animate-spin" />
              Seeding…
            {:else}
              <Sparkles class="w-4 h-4" />
              Seed demo data
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<ConfirmDialog
  bind:open={seedConfirmOpen}
  title="Seed demo data?"
  message="This adds sample categories, products, services, and events to the workspace. Re-running creates duplicates — use only on a fresh workspace."
  confirmLabel="Seed data"
  confirmVariant="primary"
  onConfirm={runSeed}
  onCancel={() => (seedConfirmOpen = false)}
/>
