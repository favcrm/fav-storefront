<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { adminInvoicesApi, adminSettingsApi } from "$lib/api/admin";
  import type { CompanyProfile } from "$lib/api/admin";
  import type { InvoiceDetail } from "$lib/types/admin";
  import { formatCurrency, formatDate, formatDateTime } from "$lib/utils/formatting";
  import { openAlignedInvoicePrint } from "$lib/utils/admin-invoice-print";
  import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import LoadingSkeleton from "$lib/components/ui/LoadingSkeleton.svelte";
  import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
  import { Download, Ban, Trash2 } from "lucide-svelte";

  let invoice = $state<InvoiceDetail | null>(null);
  let loading = $state(true);
  let error = $state("");
  let profile = $state<CompanyProfile | null>(null);

  let voidOpen = $state(false);
  let voiding = $state(false);
  let deleteOpen = $state(false);
  let deleting = $state(false);
  let downloadingInvoice = $state(false);

  onMount(() => {
    loadOrder();
    adminSettingsApi.getProfile().then((data) => (profile = data)).catch(() => {
      profile = null;
    });
  });

  async function loadOrder() {
    loading = true;
    try {
      invoice = await adminInvoicesApi.get($page.params.id!);
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to load order";
    } finally {
      loading = false;
    }
  }

  async function handleDownloadPdf() {
    if (!invoice) return;
    downloadingInvoice = true;
    try {
      const cityLine = invoice.billingAddress
        ? [invoice.billingAddress.city, invoice.billingAddress.state, invoice.billingAddress.postalCode].filter(Boolean).join(", ")
        : "";
      const opened = openAlignedInvoicePrint({
        profile,
        invoiceNumber: invoice.invoiceNumber,
        date: formatDateTime(invoice.createdAt),
        customer: {
          name: invoice.accountName ?? "Walk-in customer",
          email: invoice.accountEmail,
          phone: invoice.accountPhone,
        },
        shipToLines: invoice.billingAddress
          ? [
              invoice.billingAddress.line1,
              invoice.billingAddress.line2,
              cityLine,
              invoice.billingAddress.country,
            ].filter((line): line is string => Boolean(line))
          : [],
        items: invoice.lineItems.map((item) => ({
          name: item.description,
          quantity: item.quantity,
          unitPrice: amt(item.unitPrice),
          total: amt(item.total),
        })),
        totals: {
          subtotal: amt(invoice.amount),
          tax: amt(invoice.taxAmount),
          total: amt(invoice.total),
          currency: invoice.currency,
        },
        notes: invoice.notes,
      });
      if (!opened) {
        await adminInvoicesApi.downloadPdf(invoice.id);
      }
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to download";
    } finally {
      downloadingInvoice = false;
    }
  }

  async function handleVoid() {
    if (!invoice) return;
    voiding = true;
    try {
      await adminInvoicesApi.void(invoice.id);
      voidOpen = false;
      await loadOrder();
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to void order";
      voidOpen = false;
    } finally {
      voiding = false;
    }
  }

  async function handleDelete() {
    if (!invoice) return;
    deleting = true;
    try {
      await adminInvoicesApi.delete(invoice.id);
      goto("/admin/orders");
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to delete order";
      deleteOpen = false;
    } finally {
      deleting = false;
    }
  }

  function amt(val: string | null | undefined): number {
    return val ? parseFloat(val) : 0;
  }

  const canVoid = $derived(invoice && invoice.status !== "VOID" && invoice.status !== "CANCELLED");
  const canDelete = $derived(invoice?.status === "DRAFT");
</script>

<div>
  <a href="/admin/orders" class="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
    &larr; Back to Orders
  </a>

  {#if loading}
    <LoadingSkeleton lines={10} />
  {:else if error}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
  {:else if invoice}
    <!-- Header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-semibold text-gray-900">{invoice.invoiceNumber}</h1>
          <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Manual</span>
        </div>
        <p class="text-sm text-gray-500 mt-1">
          Created {formatDate(invoice.createdAt)}
          {#if invoice.dueDate}
            &middot; Due {formatDate(invoice.dueDate)}
          {/if}
        </p>
      </div>
      <StatusBadge status={invoice.status} variant="invoice" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Line Items -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-3">Items ({invoice.lineItems.length})</h2>
          {#if invoice.lineItems.length > 0}
            <div class="divide-y divide-gray-100">
              {#each invoice.lineItems as item (item.id)}
                <div class="flex items-center justify-between py-3">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">{item.description}</p>
                  </div>
                  <div class="text-right ml-4">
                    <p class="text-sm text-gray-700">{item.quantity} &times; {formatCurrency(amt(item.unitPrice))}</p>
                    <p class="text-sm font-medium text-gray-900">{formatCurrency(amt(item.total))}</p>
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          <div class="border-t border-gray-200 mt-3 pt-3 space-y-1">
            <div class="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span class="tabular-nums">{formatCurrency(amt(invoice.amount))}</span>
            </div>
            {#if amt(invoice.taxAmount) > 0}
              <div class="flex justify-between text-sm text-gray-600">
                <span>Tax</span>
                <span class="tabular-nums">{formatCurrency(amt(invoice.taxAmount))}</span>
              </div>
            {/if}
            <div class="flex justify-between text-base font-semibold text-gray-900 pt-1">
              <span>Total</span>
              <span class="tabular-nums">{formatCurrency(amt(invoice.total))} {invoice.currency}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        {#if invoice.notes}
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Notes</h2>
            <p class="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        {/if}
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <!-- Customer -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-2">Customer</h2>
          {#if invoice.accountName}
            <p class="text-sm text-gray-700">{invoice.accountName}</p>
            {#if invoice.accountEmail}
              <p class="text-sm text-gray-500">{invoice.accountEmail}</p>
            {/if}
            {#if invoice.accountPhone}
              <p class="text-sm text-gray-500">{invoice.accountPhone}</p>
            {/if}
          {:else}
            <p class="text-sm text-gray-400">Walk-in customer</p>
          {/if}
        </div>

        <!-- Billing Address -->
        {#if invoice.billingAddress}
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Shipping Address</h2>
            <div class="text-sm text-gray-600 space-y-0.5">
              {#if invoice.billingAddress.line1}<p>{invoice.billingAddress.line1}</p>{/if}
              {#if invoice.billingAddress.line2}<p>{invoice.billingAddress.line2}</p>{/if}
              {#if invoice.billingAddress.city}
                <p>{[invoice.billingAddress.city, invoice.billingAddress.country].filter(Boolean).join(", ")}</p>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Actions -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-3">Actions</h2>
          <div class="space-y-2">
            <Button variant="outline" size="sm" class="w-full" onclick={handleDownloadPdf} disabled={downloadingInvoice}>
              <Download class="w-4 h-4" /> {downloadingInvoice ? "Preparing..." : "Download Invoice"}
            </Button>
            {#if canVoid}
              <Button variant="danger" size="sm" class="w-full" onclick={() => (voidOpen = true)}>
                <Ban class="w-4 h-4" /> Void Order
              </Button>
            {/if}
            {#if canDelete}
              <Button variant="ghost" size="sm" class="w-full text-red-600" onclick={() => (deleteOpen = true)}>
                <Trash2 class="w-4 h-4" /> Delete Draft
              </Button>
            {/if}
          </div>
        </div>

        <!-- Details -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-2">Details</h2>
          <dl class="text-sm space-y-2">
            <div class="flex justify-between">
              <dt class="text-gray-500">ID</dt>
              <dd class="text-gray-700 font-mono text-xs">{invoice.id}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Currency</dt>
              <dd class="text-gray-700">{invoice.currency}</dd>
            </div>
            {#if invoice.paidAt}
              <div class="flex justify-between">
                <dt class="text-gray-500">Paid</dt>
                <dd class="text-gray-700">{formatDate(invoice.paidAt)}</dd>
              </div>
            {/if}
          </dl>
        </div>
      </div>
    </div>
  {/if}
</div>

<ConfirmDialog
  bind:open={voidOpen}
  title="Void Order"
  message={invoice ? `Void order "${invoice.invoiceNumber}"? This cannot be undone.` : ""}
  confirmLabel="Void Order"
  confirmVariant="danger"
  loading={voiding}
  onConfirm={handleVoid}
  onCancel={() => (voidOpen = false)}
/>

<ConfirmDialog
  bind:open={deleteOpen}
  title="Delete Draft Order"
  message={invoice ? `Delete draft "${invoice.invoiceNumber}"? This cannot be undone.` : ""}
  confirmLabel="Delete"
  confirmVariant="danger"
  loading={deleting}
  onConfirm={handleDelete}
  onCancel={() => (deleteOpen = false)}
/>
