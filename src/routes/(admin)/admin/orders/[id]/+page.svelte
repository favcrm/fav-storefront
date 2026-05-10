<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { adminOrdersApi, adminInvoicesApi, adminSettingsApi } from "$lib/api/admin";
  import type { CompanyProfile } from "$lib/api/admin";
  import type { OrderDetail, OrderStatus } from "$lib/types/admin";
  import { formatCurrency, formatDateTime } from "$lib/utils/formatting";
  import { buildLineItemDescription, getLineItemMetaParts } from "$lib/utils/order-line-items";
  import { openAlignedInvoicePrint } from "$lib/utils/admin-invoice-print";
  import OrderStatusStepper from "$lib/components/admin/OrderStatusStepper.svelte";
  import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
  import Select from "$lib/components/ui/Select.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import LoadingSkeleton from "$lib/components/ui/LoadingSkeleton.svelte";
  import { Download, RotateCcw } from "lucide-svelte";

  let order = $state<OrderDetail | null>(null);
  let loading = $state(true);
  let error = $state("");
  let updating = $state(false);
  let updateSuccess = $state(false);
  let newStatus = $state("");
  let profile = $state<CompanyProfile | null>(null);

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "refunded", label: "Refunded" },
  ];

  onMount(() => {
    loadOrder();
    adminSettingsApi.getProfile().then((data) => (profile = data)).catch(() => {
      profile = null;
    });
  });

  async function loadOrder() {
    loading = true;
    try {
      order = await adminOrdersApi.get($page.params.id!);
      newStatus = order.status;
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to load order";
    } finally {
      loading = false;
    }
  }

  async function updateStatus() {
    if (!order || newStatus === order.status) return;
    updating = true;
    updateSuccess = false;
    try {
      await adminOrdersApi.updateStatus(order.orderId, { status: newStatus });
      order.status = newStatus as OrderStatus;
      updateSuccess = true;
      setTimeout(() => (updateSuccess = false), 2000);
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to update status";
    } finally {
      updating = false;
    }
  }

  function amt(val: string | null): number {
    return val ? parseFloat(val) : 0;
  }

  let downloadingInvoice = $state(false);

  function openOrderInvoicePrint(): boolean {
    if (!order) return false;
    const customerName = order.customerInfo
      ? `${order.customerInfo.firstName} ${order.customerInfo.lastName}`.trim()
      : "Guest order";
    return openAlignedInvoicePrint({
      profile,
      invoiceNumber: `Order ${order.orderNumber}`,
      date: formatDateTime(order.createdAt),
      customer: {
        name: customerName,
        email: order.customerInfo?.email,
        phone: order.customerInfo?.phone,
      },
      shipToLines: order.shippingAddress
        ? [
            order.shippingAddress.addressLine1,
            order.shippingAddress.addressLine2,
            order.shippingAddress.city,
            order.shippingAddress.country,
          ].filter((line): line is string => Boolean(line))
        : [],
      items: order.items.map((item) => ({
        name: item.productName,
        meta: getLineItemMetaParts(item, { sku: "SKU", variant: "Variant" }).join(" · "),
        quantity: item.quantity,
        unitPrice: amt(item.unitPrice),
        total: amt(item.lineTotal),
      })),
      totals: {
        subtotal: amt(order.subtotal),
        discount: amt(order.discountAmount),
        shipping: amt(order.shippingCost),
        total: amt(order.totalAmount),
        currency: "HKD",
      },
    });
  }

  async function handleDownloadInvoice() {
    if (!order) return;
    downloadingInvoice = true;
    try {
      const opened = openOrderInvoicePrint();
      if (!opened) {
        const result = await adminInvoicesApi.create({
          amount: order.subtotal,
          total: order.totalAmount,
          taxAmount: "0",
          currency: "HKD",
          status: "PAID",
          lineItems: order.items.map((item, i) => ({
            description: buildLineItemDescription(item, { sku: "SKU", variant: "Variant" }),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.lineTotal,
            sortOrder: i,
          })),
        });
        await adminInvoicesApi.downloadPdf(result.id);
      }
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to generate invoice";
    } finally {
      downloadingInvoice = false;
    }
  }
</script>

<div>
  <a href="/admin/orders" class="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
    &larr; Back to Orders
  </a>

  {#if loading}
    <LoadingSkeleton lines={10} />
  {:else if error}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
  {:else if order}
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">Order {order.orderNumber}</h1>
        <p class="text-sm text-gray-500 mt-1">Placed {formatDateTime(order.createdAt)}</p>
      </div>
      <StatusBadge status={order.status} variant="order" />
    </div>

    <!-- Status Stepper -->
    <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <OrderStatusStepper status={order.status} />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Order Items -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-3">Items ({order.items.length})</h2>
          <div class="divide-y divide-gray-100">
            {#each order.items as item (item.id)}
              {@const metaParts = getLineItemMetaParts(item, { sku: "SKU", variant: "Variant" })}
              <div class="flex items-center justify-between py-3">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">{item.productName}</p>
                  {#if metaParts.length > 0}
                    <p class="mt-1 text-xs text-gray-500">{metaParts.join(" · ")}</p>
                  {/if}
                </div>
                <div class="text-right ml-4">
                  <p class="text-sm text-gray-700">{item.quantity} &times; {formatCurrency(amt(item.unitPrice))}</p>
                  <p class="text-sm font-medium text-gray-900">{formatCurrency(amt(item.lineTotal))}</p>
                </div>
              </div>
            {/each}
          </div>

          <!-- Totals -->
          <div class="border-t border-gray-200 mt-3 pt-3 space-y-1">
            <div class="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(amt(order.subtotal))}</span>
            </div>
            {#if amt(order.discountAmount) > 0}
              <div class="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(amt(order.discountAmount))}</span>
              </div>
            {/if}
            {#if amt(order.shippingCost) > 0}
              <div class="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>{formatCurrency(amt(order.shippingCost))}</span>
              </div>
            {/if}
            <div class="flex justify-between text-base font-semibold text-gray-900 pt-1">
              <span>Total</span>
              <span>{formatCurrency(amt(order.totalAmount))}</span>
            </div>
          </div>
        </div>

        <!-- Order Actions -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-3">Actions</h2>
          <div class="flex flex-wrap gap-2">
            <button
              onclick={handleDownloadInvoice}
              disabled={downloadingInvoice}
              class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <Download class="w-4 h-4" />
              {downloadingInvoice ? "Generating..." : "Download Invoice"}
            </button>
            {#if order.status === "delivered" || order.status === "shipped"}
              <button
                class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                onclick={() => { newStatus = "refunded"; updateStatus(); }}
              >
                <RotateCcw class="w-4 h-4" />
                Process Refund
              </button>
            {/if}
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <!-- Customer -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-2">Customer</h2>
          {#if order.customerInfo}
            <p class="text-sm text-gray-700">
              {order.customerInfo.firstName} {order.customerInfo.lastName}
            </p>
            {#if order.customerInfo.email}
              <p class="text-sm text-gray-500">{order.customerInfo.email}</p>
            {/if}
            {#if order.customerInfo.phone}
              <p class="text-sm text-gray-500">{order.customerInfo.phone}</p>
            {/if}
          {:else}
            <p class="text-sm text-gray-500">Guest order</p>
          {/if}
        </div>

        <!-- Shipping Address -->
        {#if order.shippingAddress}
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Shipping Address</h2>
            <div class="text-sm text-gray-600 space-y-0.5">
              <p>{order.shippingAddress.addressLine1}</p>
              {#if order.shippingAddress.addressLine2}
                <p>{order.shippingAddress.addressLine2}</p>
              {/if}
              <p>{order.shippingAddress.city}, {order.shippingAddress.country}</p>
            </div>
          </div>
        {/if}

        <!-- Update Status -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-3">Update Status</h2>
          <Select
            name="orderStatus"
            bind:value={newStatus}
            options={statusOptions}
            class="mb-3"
          />
          <Button
            variant="primary"
            size="sm"
            disabled={updating || newStatus === order.status}
            onclick={updateStatus}
            class="w-full"
          >
            {updating ? "Updating..." : "Update Status"}
          </Button>
          {#if updateSuccess}
            <p class="text-xs text-emerald-600 mt-2 text-center">Status updated</p>
          {/if}
        </div>

        <!-- Details -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-2">Details</h2>
          <dl class="text-sm space-y-2">
            <div class="flex justify-between">
              <dt class="text-gray-500">Order ID</dt>
              <dd class="text-gray-700 font-mono text-xs">{order.orderId}</dd>
            </div>
            {#if order.promotionCode}
              <div class="flex justify-between">
                <dt class="text-gray-500">Promo Code</dt>
                <dd class="text-gray-700">{order.promotionCode}</dd>
              </div>
            {/if}
          </dl>
        </div>
      </div>
    </div>
  {/if}
</div>
