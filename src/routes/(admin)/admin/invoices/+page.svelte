<script lang="ts">
  import { untrack } from "svelte";
  import { adminInvoicesApi } from "$lib/api/admin";
  import type { Invoice, AdminPaginatedResponse } from "$lib/types/admin";
  import { formatCurrency, formatDate } from "$lib/utils/formatting";
  import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
  import SearchInput from "$lib/components/ui/SearchInput.svelte";
  import Select from "$lib/components/ui/Select.svelte";
  import Pagination from "$lib/components/ui/Pagination.svelte";
  import LoadingSkeleton from "$lib/components/ui/LoadingSkeleton.svelte";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
  import { Plus, Trash2, FileText } from "lucide-svelte";

  let search = $state("");
  let statusFilter = $state("");
  let page = $state(1);
  let loading = $state(true);
  let data = $state<AdminPaginatedResponse<Invoice> | null>(null);
  let error = $state("");

  // Delete state (DRAFT only)
  let deleteOpen = $state(false);
  let deleteLoading = $state(false);
  let deleteTarget = $state<Invoice | null>(null);

  const statusOptions = [
    { value: "", label: "All statuses" },
    { value: "DRAFT", label: "Draft" },
    { value: "SENT", label: "Sent" },
    { value: "PAID", label: "Paid" },
    { value: "OVERDUE", label: "Overdue" },
    { value: "VOID", label: "Void" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  async function loadInvoices() {
    loading = true;
    error = "";
    try {
      data = await adminInvoicesApi.list({
        page,
        pageSize: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      });
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to load invoices";
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    search;
    statusFilter;
    page = 1;
  });

  $effect(() => {
    search;
    statusFilter;
    page;
    untrack(() => { loadInvoices(); });
  });

  function openDelete(invoice: Invoice) {
    deleteTarget = invoice;
    deleteOpen = true;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    deleteLoading = true;
    try {
      await adminInvoicesApi.delete(deleteTarget.id);
      deleteOpen = false;
      deleteTarget = null;
      await loadInvoices();
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to delete invoice";
      deleteOpen = false;
    } finally {
      deleteLoading = false;
    }
  }
</script>

<div>
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <h1 class="text-xl font-semibold text-gray-900">Invoices</h1>
      {#if data}
        <span class="text-sm text-gray-500">{data.total} total</span>
      {/if}
    </div>
    <a href="/admin/invoices/create">
      <Button size="sm">
        <Plus class="w-4 h-4" />
        New Invoice
      </Button>
    </a>
  </div>

  <div class="flex flex-col sm:flex-row gap-3 mb-4">
    <SearchInput
      bind:value={search}
      placeholder="Search invoices..."
      class="flex-1"
    />
    <Select
      name="status"
      bind:value={statusFilter}
      options={statusOptions}
      class="sm:w-48"
    />
  </div>

  {#if loading && !data}
    <LoadingSkeleton lines={8} />
  {:else if error}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
  {:else if data && data.items.length === 0}
    <EmptyState title="No invoices found" message={search || statusFilter ? "Try adjusting your search or filters" : "Create your first invoice to start billing"}>
      {#snippet icon()}<FileText class="w-6 h-6" />{/snippet}
      {#snippet actions()}
        {#if !search && !statusFilter}
          <a href="/admin/invoices/create">
            <Button size="sm"><Plus class="w-4 h-4" /> New Invoice</Button>
          </a>
        {/if}
      {/snippet}
    </EmptyState>
  {:else if data}
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="text-left px-4 py-3 font-medium text-gray-600">Invoice #</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Due Date</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.items as invoice (invoice.id)}
              <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3">
                  <a href="/admin/invoices/{invoice.id}" class="font-medium text-blue-600 hover:text-blue-800">
                    {invoice.invoiceNumber}
                  </a>
                </td>
                <td class="px-4 py-3 text-gray-700">
                  {invoice.accountName || "—"}
                </td>
                <td class="px-4 py-3 text-right font-medium text-gray-900 tabular-nums">
                  {formatCurrency(parseFloat(invoice.total))}
                </td>
                <td class="px-4 py-3">
                  <StatusBadge status={invoice.status} variant="invoice" />
                </td>
                <td class="px-4 py-3 text-gray-500">
                  {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
                </td>
                <td class="px-4 py-3 text-gray-500">{formatDate(invoice.createdAt)}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1">
                    {#if invoice.status === "DRAFT"}
                      <button
                        onclick={() => openDelete(invoice)}
                        class="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <div class="mt-4">
      <Pagination
        currentPage={data.page}
        totalPages={data.pageCount}
        onPageChange={(p) => (page = p)}
      />
    </div>
  {/if}
</div>

<ConfirmDialog
  bind:open={deleteOpen}
  title="Delete Invoice"
  message={deleteTarget ? `Are you sure you want to delete invoice "${deleteTarget.invoiceNumber}"? This action cannot be undone.` : ""}
  confirmLabel="Delete"
  confirmVariant="danger"
  loading={deleteLoading}
  onConfirm={handleDelete}
  onCancel={() => { deleteOpen = false; deleteTarget = null; }}
/>
