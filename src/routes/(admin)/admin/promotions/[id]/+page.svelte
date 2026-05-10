<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { adminPromotionsApi } from "$lib/api/admin";
  import type { PromotionDetail, UpdatePromotionInput, PromotionUsage, AdminPaginatedResponse, PromotionStatus } from "$lib/types/admin";
  import { formatDate, formatDateTime, formatCurrency, getErrorMessage } from "$lib/utils/formatting";
  import { promotionTypeOptions, promotionTypeLabels, formatPromotionValue, channelLabels, getEnabledChannels, toDatetimeLocal } from "$lib/utils/admin-helpers";

  import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
  import LoadingSkeleton from "$lib/components/ui/LoadingSkeleton.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Select from "$lib/components/ui/Select.svelte";
  import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
  import { Pencil, Trash2, Copy } from "lucide-svelte";

  let promotion = $state<PromotionDetail | null>(null);
  let usages = $state<AdminPaginatedResponse<PromotionUsage> | null>(null);
  let loading = $state(true);
  let error = $state("");
  let editing = $state(false);
  let saving = $state(false);

  // Edit form state
  let editName = $state("");
  let editCode = $state("");
  let editDescription = $state("");
  let editType = $state("PERCENTAGE");
  let editValue = $state("");
  let editMaximumDiscount = $state("");
  let editStatus = $state("DRAFT");
  let editStartsAt = $state("");
  let editEndsAt = $state("");
  let editUsageLimitTotal = $state("");
  let editUsageLimitPerCustomer = $state("");
  let editMinimumAmount = $state("");
  let editMinimumQuantity = $state("");
  let editBookingEnabled = $state(false);
  let editEventEnabled = $state(false);
  let editOnlineEnabled = $state(true);
  let editPosEnabled = $state(false);

  // Delete dialog state
  let showDeleteDialog = $state(false);
  let deleting = $state(false);

  // Clone state
  let cloneLoading = $state(false);

  const statusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "ACTIVE", label: "Active" },
    { value: "PAUSED", label: "Paused" },
    { value: "EXPIRED", label: "Expired" },
  ];

  onMount(() => {
    loadPromotion();
    loadUsages();
  });

  async function loadPromotion() {
    loading = true;
    try {
      promotion = await adminPromotionsApi.get($page.params.id!);
    } catch (err: unknown) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  }

  async function loadUsages() {
    try {
      usages = await adminPromotionsApi.usages($page.params.id!, { page: 1, pageSize: 50 });
    } catch {
      // Non-critical — silently ignore
    }
  }

  function populateEditForm() {
    if (!promotion) return;
    editName = promotion.name;
    editCode = promotion.code;
    editDescription = promotion.description ?? "";
    editType = promotion.type;
    editValue = promotion.value;
    editMaximumDiscount = promotion.maximumDiscount ?? "";
    editStatus = promotion.status;
    editStartsAt = toDatetimeLocal(promotion.startsAt);
    editEndsAt = toDatetimeLocal(promotion.endsAt);
    editUsageLimitTotal = promotion.usageLimitTotal !== null ? String(promotion.usageLimitTotal) : "";
    editUsageLimitPerCustomer = promotion.usageLimitPerCustomer !== null ? String(promotion.usageLimitPerCustomer) : "";
    editMinimumAmount = promotion.minimumAmount ?? "";
    editMinimumQuantity = promotion.minimumQuantity !== null ? String(promotion.minimumQuantity) : "";
    editBookingEnabled = promotion.bookingEnabled;
    editEventEnabled = promotion.eventEnabled;
    editOnlineEnabled = promotion.onlineEnabled;
    editPosEnabled = promotion.posEnabled;
  }

  function startEditing() {
    populateEditForm();
    editing = true;
  }

  function cancelEditing() {
    editing = false;
    error = "";
  }

  async function handleSave() {
    if (!promotion) return;
    saving = true;
    error = "";
    try {
      const input: UpdatePromotionInput = {
        name: editName.trim(),
        code: editCode.trim().toUpperCase(),
        description: editDescription.trim() || undefined,
        type: editType as UpdatePromotionInput["type"],
        value: editValue.trim(),
        maximumDiscount: editMaximumDiscount.trim() || null,
        status: editStatus as UpdatePromotionInput["status"],
        startsAt: editStartsAt ? new Date(editStartsAt).toISOString() : null,
        endsAt: editEndsAt ? new Date(editEndsAt).toISOString() : null,
        usageLimitTotal: editUsageLimitTotal.trim() ? parseInt(editUsageLimitTotal, 10) : null,
        usageLimitPerCustomer: editUsageLimitPerCustomer.trim() ? parseInt(editUsageLimitPerCustomer, 10) : null,
        minimumAmount: editMinimumAmount.trim() || null,
        minimumQuantity: editMinimumQuantity.trim() ? parseInt(editMinimumQuantity, 10) : null,
        bookingEnabled: editBookingEnabled,
        eventEnabled: editEventEnabled,
        onlineEnabled: editOnlineEnabled,
        posEnabled: editPosEnabled,
      };

      await adminPromotionsApi.update(promotion.id, input);
      editing = false;
      await loadPromotion();
    } catch (err: unknown) {
      error = getErrorMessage(err);
    } finally {
      saving = false;
    }
  }

  async function handleClone() {
    if (!promotion) return;
    cloneLoading = true;
    try {
      const cloned = await adminPromotionsApi.clone(promotion.id);
      goto(`/admin/promotions/${cloned.id}`);
    } catch (err: unknown) {
      error = getErrorMessage(err);
    } finally {
      cloneLoading = false;
    }
  }

  async function handleDelete() {
    if (!promotion) return;
    deleting = true;
    try {
      await adminPromotionsApi.delete(promotion.id);
      showDeleteDialog = false;
      goto("/admin/promotions");
    } catch (err: unknown) {
      error = getErrorMessage(err);
      showDeleteDialog = false;
    } finally {
      deleting = false;
    }
  }

</script>

<div>
  <a href="/admin/promotions" class="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
    &larr; Back to Promotions
  </a>

  {#if loading}
    <LoadingSkeleton lines={10} />
  {:else if error && !promotion}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
  {:else if promotion}
    <!-- Header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">{promotion.name}</h1>
        <p class="text-sm text-gray-500 mt-1">
          <span class="font-mono uppercase">{promotion.code}</span>
          &middot; Created {formatDate(promotion.createdAt)}
        </p>
      </div>
      <div class="flex items-center gap-2">
        {#if editing}
          <Button variant="ghost" size="sm" onclick={cancelEditing} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onclick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        {:else}
          <Button variant="outline" size="sm" onclick={startEditing}>
            <Pencil class="w-4 h-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onclick={handleClone} disabled={cloneLoading}>
            <Copy class="w-4 h-4" />
            {cloneLoading ? "Cloning..." : "Clone"}
          </Button>
          <Button variant="danger" size="sm" onclick={() => (showDeleteDialog = true)}>
            <Trash2 class="w-4 h-4" />
            Delete
          </Button>
        {/if}
      </div>
    </div>

    {#if error}
      <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm mb-4">{error}</div>
    {/if}

    {#if editing}
      <!-- Edit Mode -->
      <div class="space-y-6">
        <!-- Basic Info -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-4">Basic Information</h2>
          <div class="space-y-4">
            <Input
              name="editName"
              label="Name"
              bind:value={editName}
              placeholder="Promotion name"
              required
            />

            <div class="space-y-1">
              <label for="editCode" class="form-label">
                Code
                <span class="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="editCode"
                name="editCode"
                bind:value={editCode}
                oninput={(e) => { editCode = e.currentTarget.value.toUpperCase(); }}
                placeholder="e.g. SUMMER25"
                aria-required="true"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:ring-0 focus:bg-white focus:border-green-700 text-slate-900 font-medium font-mono uppercase transition-colors rounded-none"
              />
            </div>

            <div class="space-y-1">
              <label for="editDescription" class="form-label">Description</label>
              <textarea
                id="editDescription"
                name="editDescription"
                bind:value={editDescription}
                placeholder="Promotion description"
                rows="3"
                class="form-input text-sm"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Type & Value -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-4">Discount</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              name="editType"
              label="Type"
              bind:value={editType}
              options={promotionTypeOptions}
            />

            <Input
              name="editValue"
              label="Value"
              type="number"
              bind:value={editValue}
              placeholder="0"
              required
            />

            <Input
              name="editMaximumDiscount"
              label="Maximum Discount"
              type="number"
              bind:value={editMaximumDiscount}
              placeholder="No limit"
            />
          </div>
        </div>

        <!-- Status & Dates -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-4">Status & Schedule</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              name="editStatus"
              label="Status"
              bind:value={editStatus}
              options={statusOptions}
            />

            <div class="space-y-1">
              <label for="editStartsAt" class="form-label">Starts At</label>
              <input
                id="editStartsAt"
                name="editStartsAt"
                type="datetime-local"
                bind:value={editStartsAt}
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:ring-0 focus:bg-white focus:border-green-700 text-slate-900 font-medium transition-colors rounded-none text-sm"
              />
            </div>

            <div class="space-y-1">
              <label for="editEndsAt" class="form-label">Ends At</label>
              <input
                id="editEndsAt"
                name="editEndsAt"
                type="datetime-local"
                bind:value={editEndsAt}
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:ring-0 focus:bg-white focus:border-green-700 text-slate-900 font-medium transition-colors rounded-none text-sm"
              />
            </div>
          </div>
        </div>

        <!-- Limits -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-4">Usage Limits & Requirements</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              name="editUsageLimitTotal"
              label="Total Usage Limit"
              type="number"
              bind:value={editUsageLimitTotal}
              placeholder="Unlimited"
            />

            <Input
              name="editUsageLimitPerCustomer"
              label="Per Customer Limit"
              type="number"
              bind:value={editUsageLimitPerCustomer}
              placeholder="Unlimited"
            />

            <Input
              name="editMinimumAmount"
              label="Minimum Amount"
              type="number"
              bind:value={editMinimumAmount}
              placeholder="No minimum"
            />

            <Input
              name="editMinimumQuantity"
              label="Minimum Quantity"
              type="number"
              bind:value={editMinimumQuantity}
              placeholder="No minimum"
            />
          </div>
        </div>

        <!-- Channels -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-4">Channels</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" bind:checked={editBookingEnabled} class="rounded border-gray-300" />
              Booking
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" bind:checked={editEventEnabled} class="rounded border-gray-300" />
              Event
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" bind:checked={editOnlineEnabled} class="rounded border-gray-300" />
              Online
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" bind:checked={editPosEnabled} class="rounded border-gray-300" />
              POS
            </label>
          </div>
        </div>
      </div>
    {:else}
      <!-- View Mode -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main content -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Description -->
          {#if promotion.description}
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="font-medium text-gray-900 mb-2">Description</h2>
              <p class="text-sm text-gray-700 whitespace-pre-wrap">{promotion.description}</p>
            </div>
          {/if}

          <!-- Usage Requirements -->
          {#if promotion.minimumAmount || promotion.minimumQuantity}
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="font-medium text-gray-900 mb-3">Usage Requirements</h2>
              <dl class="text-sm space-y-2">
                {#if promotion.minimumAmount}
                  <div class="flex justify-between">
                    <dt class="text-gray-500">Minimum Amount</dt>
                    <dd class="text-gray-700">{formatCurrency(parseFloat(promotion.minimumAmount))}</dd>
                  </div>
                {/if}
                {#if promotion.minimumQuantity}
                  <div class="flex justify-between">
                    <dt class="text-gray-500">Minimum Quantity</dt>
                    <dd class="text-gray-700">{promotion.minimumQuantity}</dd>
                  </div>
                {/if}
              </dl>
            </div>
          {/if}

          <!-- Usage History -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-3">
              Usage History
              {#if usages}
                <span class="text-sm font-normal text-gray-500">({usages.total})</span>
              {/if}
            </h2>
            {#if usages && usages.items.length > 0}
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-gray-200">
                      <th class="text-left py-2 font-medium text-gray-600">Channel</th>
                      <th class="text-left py-2 font-medium text-gray-600">Order ID</th>
                      <th class="text-right py-2 font-medium text-gray-600">Discount</th>
                      <th class="text-left py-2 font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each usages.items as usage (usage.id)}
                      <tr class="border-b border-gray-50">
                        <td class="py-2.5">
                          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                            {usage.channel}
                          </span>
                        </td>
                        <td class="py-2.5 text-gray-700 font-mono text-xs">{usage.orderId ?? "—"}</td>
                        <td class="py-2.5 text-right text-gray-900 tabular-nums">{formatCurrency(parseFloat(usage.discountAmount))}</td>
                        <td class="py-2.5 text-gray-500">{formatDate(usage.createdAt)}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {:else}
              <p class="text-sm text-gray-400 py-4 text-center">No usage recorded yet</p>
            {/if}
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <!-- Status -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Status</h2>
            <StatusBadge status={promotion.status} variant="promotion" />
          </div>

          <!-- Discount -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Discount</h2>
            <dl class="text-sm space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-500">Type</dt>
                <dd class="text-gray-700">{promotionTypeLabels[promotion.type] ?? promotion.type}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Value</dt>
                <dd class="text-gray-900 font-medium">{formatPromotionValue(promotion.type, promotion.value)}</dd>
              </div>
              {#if promotion.maximumDiscount}
                <div class="flex justify-between">
                  <dt class="text-gray-500">Max Discount</dt>
                  <dd class="text-gray-700">{formatCurrency(parseFloat(promotion.maximumDiscount))}</dd>
                </div>
              {/if}
            </dl>
          </div>

          <!-- Validity -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Validity</h2>
            <dl class="text-sm space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-500">Starts</dt>
                <dd class="text-gray-700">{promotion.startsAt ? formatDateTime(promotion.startsAt) : "No start date"}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Ends</dt>
                <dd class="text-gray-700">{promotion.endsAt ? formatDateTime(promotion.endsAt) : "No end date"}</dd>
              </div>
            </dl>
          </div>

          <!-- Usage Limits -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Usage Limits</h2>
            <dl class="text-sm space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-500">Total Limit</dt>
                <dd class="text-gray-700">{promotion.usageLimitTotal !== null ? promotion.usageLimitTotal : "Unlimited"}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Per Customer</dt>
                <dd class="text-gray-700">{promotion.usageLimitPerCustomer !== null ? promotion.usageLimitPerCustomer : "Unlimited"}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Used</dt>
                <dd class="text-gray-900 font-medium">{promotion.usageCount}</dd>
              </div>
            </dl>
          </div>

          <!-- Channels -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Channels</h2>
            {#if getEnabledChannels(promotion).length > 0}
              <div class="flex items-center gap-2 flex-wrap">
                {#each getEnabledChannels(promotion) as channel (channel)}
                  <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                    {channelLabels[channel]}
                  </span>
                {/each}
              </div>
            {:else}
              <p class="text-sm text-gray-400">No channels enabled</p>
            {/if}
          </div>

          <!-- Dates -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Dates</h2>
            <dl class="text-sm space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-500">Created</dt>
                <dd class="text-gray-700">{formatDate(promotion.createdAt)}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Updated</dt>
                <dd class="text-gray-700">{formatDate(promotion.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Delete Confirmation -->
<ConfirmDialog
  bind:open={showDeleteDialog}
  title="Delete Promotion"
  message={promotion ? `Are you sure you want to delete "${promotion.name}"? This action cannot be undone.` : ""}
  confirmLabel="Delete"
  confirmVariant="danger"
  loading={deleting}
  onConfirm={handleDelete}
  onCancel={() => (showDeleteDialog = false)}
/>
