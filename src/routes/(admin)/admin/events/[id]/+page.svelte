<script lang="ts">
  import { onMount } from "svelte";
  import { adminEventsApi } from "$lib/api/admin";
  import { formatDate } from "$lib/utils/formatting";
  import Pagination from "$lib/components/ui/Pagination.svelte";
  import LoadingSkeleton from "$lib/components/ui/LoadingSkeleton.svelte";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import { Users, ArrowLeft } from "lucide-svelte";
  import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  
  let loading = $state(true);
  let error = $state("");
  let event = $state<any>(null);
  let registrations = $state<any[]>([]);
  let total = $state(0);
  let page = $state(1);
  const pageSize = 50;

  async function load() {
    loading = true;
    error = "";
    try {
      const [eventRes, regsRes] = await Promise.all([
        adminEventsApi.get(data.id),
        adminEventsApi.listRegistrations(data.id, { page, pageSize })
      ]);
      event = eventRes;
      registrations = regsRes.items;
      total = regsRes.total;
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to load event details";
    } finally {
      loading = false;
    }
  }

  onMount(load);

  // Reload on page change
  $effect(() => { page; load(); });

  const totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));
</script>

<div>
  <!-- Header -->
  <div class="mb-6">
    <a href="/admin/events" class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4">
      <ArrowLeft size={16} /> Back to Events
    </a>
    
    {#if event}
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">{event.title}</h1>
          <p class="text-gray-500 mt-1">{event.slug}</p>
        </div>
        <StatusBadge status={event.status} variant="order" />
      </div>
    {:else if loading}
      <div class="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
    {/if}
  </div>

  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
      <h2 class="text-base font-semibold text-gray-900">Guest List & Registrations</h2>
      {#if total > 0}
        <span class="text-sm text-gray-500">{total} total guests</span>
      {/if}
    </div>

    {#if loading && registrations.length === 0}
      <div class="p-6">
        <LoadingSkeleton lines={5} />
      </div>
    {:else if error}
      <div class="p-6">
        <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      </div>
    {:else if registrations.length === 0}
      <div class="p-8">
        <EmptyState
          title="No registrations yet"
          message="When users register for this event, they will appear here."
        >
          {#snippet icon()}<Users class="w-6 h-6" />{/snippet}
        </EmptyState>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="text-left px-6 py-3 font-medium text-gray-600">Guest</th>
              <th class="text-left px-6 py-3 font-medium text-gray-600">Contact</th>
              <th class="text-left px-6 py-3 font-medium text-gray-600">Session</th>
              <th class="text-right px-6 py-3 font-medium text-gray-600">Qty</th>
              <th class="text-right px-6 py-3 font-medium text-gray-600">Total</th>
              <th class="text-left px-6 py-3 font-medium text-gray-600">Status</th>
              <th class="text-left px-6 py-3 font-medium text-gray-600">Registered</th>
            </tr>
          </thead>
          <tbody>
            {#each registrations as reg (reg.id)}
              <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="px-6 py-3 font-medium text-gray-900">{reg.guestName}</td>
                <td class="px-6 py-3 text-gray-600">
                  <div>{reg.email}</div>
                  {#if reg.phone}
                    <div class="text-xs text-gray-500 mt-0.5">{reg.phone}</div>
                  {/if}
                </td>
                <td class="px-6 py-3 text-gray-600">
                  {reg.sessionStartTime ? formatDate(reg.sessionStartTime) : '-'}
                </td>
                <td class="px-6 py-3 text-right font-medium text-gray-900">{reg.quantity}</td>
                <td class="px-6 py-3 text-right text-gray-900 tabular-nums">
                  {Number(reg.totalAmount) === 0 ? 'Free' : `${reg.currency} ${(Number(reg.totalAmount) / 100).toFixed(2)}`}
                </td>
                <td class="px-6 py-3">
                  <StatusBadge status={reg.status} variant="order" />
                </td>
                <td class="px-6 py-3 text-gray-500 text-xs">{formatDate(reg.registeredAt)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  {#if totalPages > 1}
    <div class="mt-4">
      <Pagination currentPage={page} {totalPages} onPageChange={(p) => (page = p)} />
    </div>
  {/if}
</div>
