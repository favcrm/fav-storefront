<script lang="ts">
  import { adminDashboardApi, adminOrdersApi, adminCustomersApi, adminProductsApi, adminInvoicesApi } from "$lib/api/admin";
  import type { DashboardStats, AcquisitionChannel, Order, InvoiceStats, OrderStatus } from "$lib/types/admin";
  import { formatCurrency, formatRelativeTime } from "$lib/utils/formatting";
  import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
  import LoadingSkeleton from "$lib/components/ui/LoadingSkeleton.svelte";
  import {
    Users,
    UserPlus,
    ShoppingBag,
    Package,
    TrendingUp,
    Gift,
    Megaphone,
    MessageCircle,
    ArrowUpRight,
    ArrowRight,
    DollarSign,
    Receipt,
    FileText,
    AlertCircle,
  } from "lucide-svelte";

  let stats = $state<DashboardStats | null>(null);
  let channels = $state<AcquisitionChannel[]>([]);
  let allOrders = $state<Order[]>([]);
  let invoiceStats = $state<InvoiceStats | null>(null);
  let orderTotal = $state(0);
  let productCount = $state(0);
  let customerCount = $state(0);
  let loading = $state(true);
  let error = $state("");

  type Period = "7d" | "30d" | "all";
  let period = $state<Period>("30d");

  async function loadDashboard() {
    loading = true;
    error = "";
    try {
      const [statsRes, channelsRes, ordersRes, productsRes, customersRes, invoiceStatsRes] = await Promise.all([
        adminDashboardApi.stats(),
        adminDashboardApi.acquisitionChannels(),
        adminOrdersApi.list({ page: 1, pageSize: 100, ordering: "-createdAt" }),
        adminProductsApi.list({ page: 1, pageSize: 1 }),
        adminCustomersApi.list({ page: 1, pageSize: 1 }),
        adminInvoicesApi.stats().catch(() => null),
      ]);
      stats = statsRes;
      channels = channelsRes;
      allOrders = ordersRes.items;
      orderTotal = ordersRes.total;
      productCount = productsRes.total;
      customerCount = customersRes.total;
      invoiceStats = invoiceStatsRes;
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to load dashboard";
    } finally {
      loading = false;
    }
  }

  loadDashboard();

  // Period filter
  function periodCutoff(p: Period): Date {
    const now = new Date();
    if (p === "7d") return new Date(now.getTime() - 7 * 86400000);
    if (p === "30d") return new Date(now.getTime() - 30 * 86400000);
    return new Date(0);
  }

  const filteredOrders = $derived(
    allOrders.filter((o) => new Date(o.createdAt) >= periodCutoff(period))
  );

  const revenueOrders = $derived(
    filteredOrders.filter((o) => o.status !== "cancelled" && o.status !== "refunded")
  );

  const totalRevenue = $derived(
    revenueOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0)
  );

  const avgOrderValue = $derived(
    revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0
  );

  const recentOrders = $derived(allOrders.slice(0, 5));

  // Order status breakdown
  const statusBreakdown = $derived(() => {
    const counts: Partial<Record<OrderStatus, number>> = {};
    for (const o of filteredOrders) {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({ status: status as OrderStatus, count }));
  });

  const maxStatusCount = $derived(
    Math.max(...(statusBreakdown().map((s) => s.count)), 1)
  );

  // Channel chart
  const maxChannelCount = $derived(
    Math.max(...channels.map((c) => c.count), 1)
  );

  function channelLabel(source: string | null): string {
    if (!source) return "Unknown";
    return source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function customerName(order: Order): string {
    if (!order.customerInfo) return "Guest";
    const { firstName, lastName } = order.customerInfo;
    return [firstName, lastName].filter(Boolean).join(" ") || order.customerInfo.email || "Guest";
  }

  const statusColors: Record<string, string> = {
    delivered: "bg-emerald-500",
    shipped: "bg-violet-500",
    processing: "bg-sky-500",
    confirmed: "bg-blue-500",
    pending: "bg-amber-500",
    cancelled: "bg-red-400",
    refunded: "bg-gray-400",
  };

  const channelColors = [
    "bg-emerald-500",
    "bg-amber-500",
    "bg-sky-500",
    "bg-rose-500",
    "bg-violet-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-indigo-500",
  ];

  const periods: { value: Period; label: string }[] = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "all", label: "All Time" },
  ];
</script>

<div class="space-y-6">
  <!-- Page Header -->
  <div>
    <h1 class="text-xl font-semibold text-gray-900">Dashboard</h1>
    <p class="text-sm text-gray-500 mt-1">Overview of your business at a glance</p>
  </div>

  {#if loading}
    <LoadingSkeleton lines={12} />
  {:else if error}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
  {:else}
    <!-- KPI Cards — top row -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <a href="/admin/customers" class="group block bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Users class="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <ArrowUpRight class="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
        </div>
        <div class="text-2xl font-semibold text-gray-900 tabular-nums">{customerCount.toLocaleString()}</div>
        <div class="text-xs text-gray-500 mt-1">Total Customers</div>
      </a>

      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center">
            <UserPlus class="w-4.5 h-4.5 text-sky-600" />
          </div>
        </div>
        <div class="text-2xl font-semibold text-gray-900 tabular-nums">{stats?.newMembersThisWeek ?? 0}</div>
        <div class="text-xs text-gray-500 mt-1">New This Week</div>
      </div>

      <a href="/admin/orders" class="group block bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
            <ShoppingBag class="w-4.5 h-4.5 text-amber-600" />
          </div>
          <ArrowUpRight class="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
        </div>
        <div class="text-2xl font-semibold text-gray-900 tabular-nums">{orderTotal.toLocaleString()}</div>
        <div class="text-xs text-gray-500 mt-1">Total Orders</div>
      </a>

      <a href="/admin/products" class="group block bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
            <Package class="w-4.5 h-4.5 text-violet-600" />
          </div>
          <ArrowUpRight class="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
        </div>
        <div class="text-2xl font-semibold text-gray-900 tabular-nums">{productCount.toLocaleString()}</div>
        <div class="text-xs text-gray-500 mt-1">Products</div>
      </a>
    </div>

    <!-- Sales Overview -->
    <div class="bg-white rounded-xl border border-gray-200">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 class="text-sm font-semibold text-gray-900">Sales Overview</h2>
        <div class="flex rounded-lg border border-gray-200 overflow-hidden">
          {#each periods as p (p.value)}
            <button
              onclick={() => (period = p.value)}
              class="px-3 py-1.5 text-xs font-medium transition-colors {period === p.value
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'}"
            >
              {p.label}
            </button>
          {/each}
        </div>
      </div>

      <!-- Sales KPI row -->
      <div class="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
        <div class="px-5 py-4">
          <div class="flex items-center gap-2 mb-1">
            <DollarSign class="w-3.5 h-3.5 text-emerald-500" />
            <span class="text-xs text-gray-500">Revenue</span>
          </div>
          <div class="text-xl font-semibold text-gray-900 tabular-nums">{formatCurrency(totalRevenue)}</div>
          <div class="text-xs text-gray-400 mt-0.5">{revenueOrders.length} orders</div>
        </div>
        <div class="px-5 py-4">
          <div class="flex items-center gap-2 mb-1">
            <Receipt class="w-3.5 h-3.5 text-sky-500" />
            <span class="text-xs text-gray-500">Avg Order</span>
          </div>
          <div class="text-xl font-semibold text-gray-900 tabular-nums">{formatCurrency(avgOrderValue)}</div>
        </div>
        {#if invoiceStats}
          <div class="px-5 py-4">
            <div class="flex items-center gap-2 mb-1">
              <FileText class="w-3.5 h-3.5 text-violet-500" />
              <span class="text-xs text-gray-500">Invoiced</span>
            </div>
            <div class="text-xl font-semibold text-gray-900 tabular-nums">{formatCurrency(parseFloat(invoiceStats.totalPaid))}</div>
            <div class="text-xs text-gray-400 mt-0.5">paid</div>
          </div>
          <div class="px-5 py-4">
            <div class="flex items-center gap-2 mb-1">
              <AlertCircle class="w-3.5 h-3.5 text-amber-500" />
              <span class="text-xs text-gray-500">Outstanding</span>
            </div>
            <div class="text-xl font-semibold text-gray-900 tabular-nums">{formatCurrency(parseFloat(invoiceStats.totalOutstanding))}</div>
            {#if invoiceStats.overdueCount > 0}
              <div class="text-xs text-red-500 mt-0.5">{invoiceStats.overdueCount} overdue</div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Order Status Breakdown -->
      {#if statusBreakdown().length > 0}
        <div class="px-5 py-4">
          <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Order Status</h3>
          <div class="space-y-2.5">
            {#each statusBreakdown() as item (item.status)}
              <div class="flex items-center gap-3">
                <span class="text-xs text-gray-600 w-20 shrink-0 capitalize">{item.status}</span>
                <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500 {statusColors[item.status] ?? 'bg-gray-400'}"
                    style="width: {Math.max((item.count / maxStatusCount) * 100, 3)}%"
                  ></div>
                </div>
                <span class="text-xs text-gray-500 tabular-nums w-8 text-right">{item.count}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Middle Row: Recent Orders + Acquisition Channels -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2 bg-white rounded-xl border border-gray-200">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-900">Recent Orders</h2>
          <a href="/admin/orders" class="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors">
            View all
            <ArrowRight class="w-3 h-3" />
          </a>
        </div>
        {#if recentOrders.length === 0}
          <div class="px-5 py-10 text-center text-sm text-gray-400">No orders yet</div>
        {:else}
          <div class="divide-y divide-gray-50">
            {#each recentOrders as order (order.id)}
              <a href="/admin/orders/{order.orderId}" class="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-900">{order.orderNumber}</span>
                    <StatusBadge status={order.status} variant="order" />
                  </div>
                  <div class="text-xs text-gray-500 mt-0.5">{customerName(order)}</div>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-sm font-medium text-gray-900 tabular-nums">{formatCurrency(parseFloat(order.totalAmount))}</div>
                  <div class="text-xs text-gray-400 mt-0.5">{formatRelativeTime(order.createdAt)}</div>
                </div>
              </a>
            {/each}
          </div>
        {/if}
      </div>

      <div class="bg-white rounded-xl border border-gray-200">
        <div class="px-5 py-4 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-900">Acquisition Channels</h2>
        </div>
        {#if channels.length === 0}
          <div class="px-5 py-10 text-center text-sm text-gray-400">No data yet</div>
        {:else}
          <div class="p-5 space-y-4">
            {#each channels as channel, i (channel.source ?? "unknown")}
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-medium text-gray-700">{channelLabel(channel.source)}</span>
                  <span class="text-xs text-gray-500 tabular-nums">{channel.count}</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500 {channelColors[i % channelColors.length]}"
                    style="width: {Math.max((channel.count / maxChannelCount) * 100, 2)}%"
                  ></div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Bottom Row: CRM Metrics -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex items-center gap-2.5 mb-2">
          <div class="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center">
            <TrendingUp class="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span class="text-xs text-gray-500">Subscriptions</span>
        </div>
        <div class="text-lg font-semibold text-gray-900 tabular-nums">{stats?.activeSubscriptions ?? 0}</div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex items-center gap-2.5 mb-2">
          <div class="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center">
            <Gift class="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span class="text-xs text-gray-500">Rewards Redeemed</span>
        </div>
        <div class="text-lg font-semibold text-gray-900 tabular-nums">{stats?.rewardsRedeemed ?? 0}</div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex items-center gap-2.5 mb-2">
          <div class="w-7 h-7 rounded-md bg-rose-50 flex items-center justify-center">
            <Megaphone class="w-3.5 h-3.5 text-rose-600" />
          </div>
          <span class="text-xs text-gray-500">Active Promos</span>
        </div>
        <div class="text-lg font-semibold text-gray-900 tabular-nums">{stats?.activePromotions ?? 0}</div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <div class="flex items-center gap-2.5 mb-2">
          <div class="w-7 h-7 rounded-md bg-sky-50 flex items-center justify-center">
            <MessageCircle class="w-3.5 h-3.5 text-sky-600" />
          </div>
          <span class="text-xs text-gray-500">Messages Sent</span>
        </div>
        <div class="text-lg font-semibold text-gray-900 tabular-nums">{stats?.messagesSent ?? 0}</div>
      </div>
    </div>
  {/if}
</div>
