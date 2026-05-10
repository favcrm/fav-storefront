<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { adminInvoicesApi } from "$lib/api/admin";
  import type { InvoiceDetail } from "$lib/types/admin";
  import { formatCurrency, formatDate } from "$lib/utils/formatting";
  import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import LoadingSkeleton from "$lib/components/ui/LoadingSkeleton.svelte";
  import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
  import { Download, Ban, Pencil } from "lucide-svelte";

  let invoice = $state<InvoiceDetail | null>(null);
  let loading = $state(true);
  let error = $state("");

  // Void dialog
  let voidOpen = $state(false);
  let voiding = $state(false);

  onMount(() => { loadInvoice(); });

  async function loadInvoice() {
    loading = true;
    try {
      invoice = await adminInvoicesApi.get($page.params.id!);
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to load invoice";
    } finally {
      loading = false;
    }
  }

  async function handleDownloadPdf() {
    if (!invoice) return;
    try {
      await adminInvoicesApi.downloadPdf(invoice.id);
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to download PDF";
    }
  }

  async function handleVoid() {
    if (!invoice) return;
    voiding = true;
    try {
      await adminInvoicesApi.void(invoice.id);
      voidOpen = false;
      await loadInvoice();
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to void invoice";
      voidOpen = false;
    } finally {
      voiding = false;
    }
  }

  function amt(val: string | null | undefined): number {
    return val ? parseFloat(val) : 0;
  }

  const canEdit = $derived(invoice?.status === "DRAFT");
  const canVoid = $derived(
    invoice && invoice.status !== "VOID" && invoice.status !== "CANCELLED"
  );
</script>

<div>
  <a href="/admin/invoices" class="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
    &larr; Back to Invoices
  </a>

  {#if loading}
    <LoadingSkeleton lines={10} />
  {:else if error}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
  {:else if invoice}
    <!-- Header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">{invoice.invoiceNumber}</h1>
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
          <h2 class="font-medium text-gray-900 mb-3">
            Line Items ({invoice.lineItems.length})
          </h2>
          {#if invoice.lineItems.length === 0}
            <p class="text-sm text-gray-400 py-4 text-center">No line items</p>
          {:else}
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="text-left py-2 font-medium text-gray-600">Description</th>
                    <th class="text-right py-2 font-medium text-gray-600 w-20">Qty</th>
                    <th class="text-right py-2 font-medium text-gray-600 w-28">Unit Price</th>
                    <th class="text-right py-2 font-medium text-gray-600 w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {#each invoice.lineItems as item (item.id)}
                    <tr class="border-b border-gray-50">
                      <td class="py-2.5 text-gray-900">{item.description}</td>
                      <td class="py-2.5 text-right text-gray-700 tabular-nums">{item.quantity}</td>
                      <td class="py-2.5 text-right text-gray-700 tabular-nums">{formatCurrency(amt(item.unitPrice))}</td>
                      <td class="py-2.5 text-right font-medium text-gray-900 tabular-nums">{formatCurrency(amt(item.total))}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}

          <!-- Totals -->
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
            <p class="text-sm text-gray-400">No customer assigned</p>
          {/if}
        </div>

        <!-- Billing Address -->
        {#if invoice.billingAddress}
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Billing Address</h2>
            <div class="text-sm text-gray-600 space-y-0.5">
              {#if invoice.billingAddress.line1}
                <p>{invoice.billingAddress.line1}</p>
              {/if}
              {#if invoice.billingAddress.line2}
                <p>{invoice.billingAddress.line2}</p>
              {/if}
              {#if invoice.billingAddress.city || invoice.billingAddress.state}
                <p>
                  {[invoice.billingAddress.city, invoice.billingAddress.state].filter(Boolean).join(", ")}
                  {#if invoice.billingAddress.postalCode}
                    {invoice.billingAddress.postalCode}
                  {/if}
                </p>
              {/if}
              {#if invoice.billingAddress.country}
                <p>{invoice.billingAddress.country}</p>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Actions -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-3">Actions</h2>
          <div class="space-y-2">
            <Button variant="outline" size="sm" class="w-full" onclick={handleDownloadPdf}>
              <Download class="w-4 h-4" />
              Download PDF
            </Button>
            {#if canEdit}
              <a href="/admin/invoices/create?edit={invoice.id}" class="block">
                <Button variant="outline" size="sm" class="w-full">
                  <Pencil class="w-4 h-4" />
                  Edit Invoice
                </Button>
              </a>
            {/if}
            {#if canVoid}
              <Button variant="danger" size="sm" class="w-full" onclick={() => (voidOpen = true)}>
                <Ban class="w-4 h-4" />
                Void Invoice
              </Button>
            {/if}
          </div>
        </div>

        <!-- Details -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-2">Details</h2>
          <dl class="text-sm space-y-2">
            <div class="flex justify-between">
              <dt class="text-gray-500">Invoice ID</dt>
              <dd class="text-gray-700 font-mono text-xs">{invoice.id}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Currency</dt>
              <dd class="text-gray-700">{invoice.currency}</dd>
            </div>
            {#if invoice.paymentMethod}
              <div class="flex justify-between">
                <dt class="text-gray-500">Payment Method</dt>
                <dd class="text-gray-700">{invoice.paymentMethod}</dd>
              </div>
            {/if}
            {#if invoice.paidAt}
              <div class="flex justify-between">
                <dt class="text-gray-500">Paid At</dt>
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
  title="Void Invoice"
  message={invoice ? `Are you sure you want to void invoice "${invoice.invoiceNumber}"? This action cannot be undone.` : ""}
  confirmLabel="Void Invoice"
  confirmVariant="danger"
  loading={voiding}
  onConfirm={handleVoid}
  onCancel={() => (voidOpen = false)}
/>
