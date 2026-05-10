<script lang="ts">
  import { untrack } from "svelte";
  import { adminOrdersApi, adminInvoicesApi } from "$lib/api/admin";
  import type { Order, Invoice } from "$lib/types/admin";
  import { formatCurrency, formatDate } from "$lib/utils/formatting";
  import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
  import SearchInput from "$lib/components/ui/SearchInput.svelte";
  import Pagination from "$lib/components/ui/Pagination.svelte";
  import LoadingSkeleton from "$lib/components/ui/LoadingSkeleton.svelte";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { ShoppingBag, Plus } from "lucide-svelte";

  // Unified row type
  interface OrderRow {
    id: string;
    href: string;
    number: string;
    customer: string;
    total: number;
    status: string;
    statusVariant: "order" | "invoice";
    isManual: boolean;
    createdAt: string;
  }

  let search = $state("");
  let loading = $state(true);
  let error = $state("");
  let allRows = $state<OrderRow[]>([]);
  let page = $state(1);
  const pageSize = 20;

  function orderToRow(o: Order): OrderRow {
    let customer = "Guest";
    if (o.customerInfo) {
      const { firstName, lastName } = o.customerInfo;
      customer = [firstName, lastName].filter(Boolean).join(" ") || o.customerInfo.email || "Guest";
    }
    return {
      id: o.orderId,
      href: `/admin/orders/${o.orderId}`,
      number: o.orderNumber,
      customer,
      total: parseFloat(o.totalAmount),
      status: o.status,
      statusVariant: "order",
      isManual: false,
      createdAt: o.createdAt,
    };
  }

  function invoiceToRow(inv: Invoice): OrderRow {
    return {
      id: inv.id,
      href: `/admin/orders/manual/${inv.id}`,
      number: inv.invoiceNumber,
      customer: inv.accountName || "Walk-in",
      total: parseFloat(inv.total),
      status: inv.status,
      statusVariant: "invoice",
      isManual: true,
      createdAt: inv.createdAt,
    };
  }

  async function loadAll() {
    loading = true;
    error = "";
    try {
      const [ordersRes, invoicesRes] = await Promise.all([
        adminOrdersApi.list({ page: 1, pageSize: 100, search: search || undefined, ordering: "-createdAt" }),
        adminInvoicesApi.list({ page: 1, pageSize: 100, search: search || undefined }).catch(() => ({ items: [] as Invoice[], total: 0, page: 1, pageSize: 100, pageCount: 0 })),
      ]);

      const storeRows = ordersRes.items.map(orderToRow);
      const manualRows = invoicesRes.items.map(invoiceToRow);

      // Merge and sort by date descending
      allRows = [...storeRows, ...manualRows].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to load orders";
    } finally {
      loading = false;
    }
  }

  // Reset page on search
  $effect(() => { search; page = 1; });

  // Reload on search change (debounced via the effect chain)
  $effect(() => { search; untrack(() => { loadAll(); }); });

  // Client-side pagination
  const totalPages = $derived(Math.max(1, Math.ceil(allRows.length / pageSize)));
  const pagedRows = $derived(allRows.slice((page - 1) * pageSize, page * pageSize));
</script>

<div>
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <h1 class="text-xl font-semibold text-gray-900">Orders</h1>
      {#if allRows.length > 0}
        <span class="text-sm text-gray-500">{allRows.length} total</span>
      {/if}
    </div>
    <a href="/admin/orders/create">
      <Button size="sm">
        <Plus class="w-4 h-4" />
        Create Order
      </Button>
    </a>
  </div>

  <!-- Search -->
  <div class="mb-4">
    <SearchInput bind:value={search} placeholder="Search orders..." class="max-w-md" />
  </div>

  {#if loading && allRows.length === 0}
    <LoadingSkeleton lines={8} />
  {:else if error}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
  {:else if allRows.length === 0}
    <EmptyState
      title="No orders yet"
      message={search ? "Try adjusting your search" : "Orders from your store and manual orders will appear here"}
    >
      {#snippet icon()}<ShoppingBag class="w-6 h-6" />{/snippet}
      {#snippet actions()}
        {#if !search}
          <a href="/admin/orders/create">
            <Button size="sm"><Plus class="w-4 h-4" /> Create Order</Button>
          </a>
        {/if}
      {/snippet}
    </EmptyState>
  {:else}
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="text-left px-4 py-3 font-medium text-gray-600">Order #</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Date</th>
            </tr>
          </thead>
          <tbody>
            {#each pagedRows as row (row.id)}
              <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <a href={row.href} class="font-medium text-blue-600 hover:text-blue-800">
                      {row.number}
                    </a>
                    {#if row.isManual}
                      <span class="text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Manual</span>
                    {/if}
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-700">{row.customer}</td>
                <td class="px-4 py-3 text-right font-medium text-gray-900 tabular-nums">
                  {formatCurrency(row.total)}
                </td>
                <td class="px-4 py-3">
                  <StatusBadge status={row.status} variant={row.statusVariant} />
                </td>
                <td class="px-4 py-3 text-gray-500">{formatDate(row.createdAt)}</td>
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
