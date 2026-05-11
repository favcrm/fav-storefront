<script lang="ts">
  import { untrack } from "svelte";
  import { adminEventsApi } from "$lib/api/admin";
  import { formatDate } from "$lib/utils/formatting";
  import SearchInput from "$lib/components/ui/SearchInput.svelte";
  import Pagination from "$lib/components/ui/Pagination.svelte";
  import LoadingSkeleton from "$lib/components/ui/LoadingSkeleton.svelte";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import { CalendarDays } from "lucide-svelte";
  import StatusBadge from "$lib/components/admin/StatusBadge.svelte";

  let search = $state("");
  let loading = $state(true);
  let error = $state("");
  let events = $state<any[]>([]);
  let total = $state(0);
  let page = $state(1);
  const pageSize = 20;

  async function loadEvents() {
    loading = true;
    error = "";
    try {
      const res = await adminEventsApi.list({ page, pageSize, search: search || undefined });
      events = res.items;
      total = res.total;
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to load events";
    } finally {
      loading = false;
    }
  }

  // Reset page on search
  $effect(() => { search; page = 1; });

  // Reload on search change or page change
  $effect(() => { search; page; untrack(() => { loadEvents(); }); });

  const totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));
</script>

<div>
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <h1 class="text-xl font-semibold text-gray-900">Events</h1>
      {#if total > 0}
        <span class="text-sm text-gray-500">{total} total</span>
      {/if}
    </div>
  </div>

  <!-- Search -->
  <div class="mb-4">
    <SearchInput bind:value={search} placeholder="Search events..." class="max-w-md" />
  </div>

  {#if loading && events.length === 0}
    <LoadingSkeleton lines={8} />
  {:else if error}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
  {:else if events.length === 0}
    <EmptyState
      title="No events found"
      message={search ? "Try adjusting your search" : "No events have been created yet."}
    >
      {#snippet icon()}<CalendarDays class="w-6 h-6" />{/snippet}
    </EmptyState>
  {:else}
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="text-left px-4 py-3 font-medium text-gray-600">Event</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Dates</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Price</th>
            </tr>
          </thead>
          <tbody>
            {#each events as event (event.id)}
              <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    {#if event.imageUrl}
                      <img src={event.imageUrl} alt="" class="w-10 h-10 rounded object-cover bg-gray-100" />
                    {:else}
                      <div class="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                        <CalendarDays size={16} />
                      </div>
                    {/if}
                    <div>
                      <a href={`/admin/events/${event.id}`} class="font-medium text-blue-600 hover:text-blue-800">
                        {event.title}
                      </a>
                      <div class="text-xs text-gray-500 mt-0.5">{event.slug}</div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <StatusBadge status={event.status} variant="order" />
                </td>
                <td class="px-4 py-3 text-gray-700">
                  {#if event.dates && event.dates.length > 0}
                    {formatDate(event.dates[0].startTime)}
                    {#if event.dates.length > 1}
                      <span class="text-xs text-gray-500 ml-1">+{event.dates.length - 1} more</span>
                    {/if}
                  {:else}
                    <span class="text-gray-400">No dates</span>
                  {/if}
                </td>
                <td class="px-4 py-3 text-right font-medium text-gray-900 tabular-nums">
                  {event.price === 0 ? 'Free' : `${event.currency} ${(event.price / 100).toFixed(2)}`}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    {#if totalPages > 1}
      <div class="mt-4">
        <Pagination currentPage={page} {totalPages} onPageChange={(p) => (page = p)} />
      </div>
    {/if}
  {/if}
</div>
