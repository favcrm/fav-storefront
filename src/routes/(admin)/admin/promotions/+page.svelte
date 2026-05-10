<script lang="ts">
  import { untrack } from "svelte";
  import { adminPromotionsApi } from "$lib/api/admin";
  import type { Promotion, AdminPaginatedResponse, CreatePromotionInput } from "$lib/types/admin";
  import { formatDate, getErrorMessage } from "$lib/utils/formatting";
  import { promotionTypeOptions, promotionTypeLabels, formatPromotionValue, channelLabels, getEnabledChannels } from "$lib/utils/admin-helpers";

  import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
  import SearchInput from "$lib/components/ui/SearchInput.svelte";
  import Pagination from "$lib/components/ui/Pagination.svelte";
  import LoadingSkeleton from "$lib/components/ui/LoadingSkeleton.svelte";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import Modal from "$lib/components/ui/Modal.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Select from "$lib/components/ui/Select.svelte";
  import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
  import { Pencil, Trash2, Plus, Ticket, Copy } from "lucide-svelte";

  let search = $state("");
  let page = $state(1);
  let loading = $state(true);
  let data = $state<AdminPaginatedResponse<Promotion> | null>(null);
  let error = $state("");
  let statusFilter = $state("");

  // Create modal state
  let showCreateModal = $state(false);
  let creating = $state(false);
  let createError = $state("");
  let createName = $state("");
  let createCode = $state("");
  let createType = $state("PERCENTAGE");
  let createValue = $state("");
  let createStatus = $state("DRAFT");
  let createStartsAt = $state("");
  let createEndsAt = $state("");
  let createBookingEnabled = $state(false);
  let createEventEnabled = $state(false);
  let createOnlineEnabled = $state(true);
  let createPosEnabled = $state(false);

  // Delete dialog state
  let showDeleteDialog = $state(false);
  let deleting = $state(false);
  let deleteTarget = $state<Promotion | null>(null);

  // Clone state
  let cloning = $state<string | null>(null);

  // Action error (clone/delete) — always visible when set
  let actionError = $state("");

  const statusFilters = [
    { value: "", label: "All" },
    { value: "DRAFT", label: "Draft" },
    { value: "ACTIVE", label: "Active" },
    { value: "PAUSED", label: "Paused" },
    { value: "EXPIRED", label: "Expired" },
  ];

  const createStatusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "ACTIVE", label: "Active" },
  ];

  async function loadPromotions() {
    loading = true;
    error = "";
    try {
      data = await adminPromotionsApi.list({
        page,
        pageSize: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        ordering: "-createdAt",
      });
    } catch (err: unknown) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  }

  let prevSearch = "";
  let prevFilter = "";

  $effect(() => {
    const s = search;
    const f = statusFilter;
    if (s !== prevSearch || f !== prevFilter) {
      prevSearch = s;
      prevFilter = f;
      page = 1;
    }
    page;
    untrack(() => { loadPromotions(); });
  });

  function resetCreateForm() {
    createName = "";
    createCode = "";
    createType = "PERCENTAGE";
    createValue = "";
    createStatus = "DRAFT";
    createStartsAt = "";
    createEndsAt = "";
    createBookingEnabled = false;
    createEventEnabled = false;
    createOnlineEnabled = true;
    createPosEnabled = false;
    createError = "";
  }

  function openCreateModal() {
    resetCreateForm();
    showCreateModal = true;
  }

  async function handleCreate() {
    if (!createName.trim() || !createCode.trim()) {
      createError = "Name and code are required.";
      return;
    }

    if (!createValue.trim()) {
      createError = "Value is required.";
      return;
    }

    const valueNum = parseFloat(createValue);
    if (isNaN(valueNum) || valueNum < 0) {
      createError = "Please enter a valid value.";
      return;
    }

    creating = true;
    createError = "";
    try {
      const input: CreatePromotionInput = {
        name: createName.trim(),
        code: createCode.trim().toUpperCase(),
        type: createType as CreatePromotionInput["type"],
        value: createValue.trim(),
        status: createStatus as CreatePromotionInput["status"],
        bookingEnabled: createBookingEnabled,
        eventEnabled: createEventEnabled,
        onlineEnabled: createOnlineEnabled,
        posEnabled: createPosEnabled,
      };
      if (createStartsAt) input.startsAt = new Date(createStartsAt).toISOString();
      if (createEndsAt) input.endsAt = new Date(createEndsAt).toISOString();

      await adminPromotionsApi.create(input);
      showCreateModal = false;
      loadPromotions();
    } catch (err: unknown) {
      createError = getErrorMessage(err);
    } finally {
      creating = false;
    }
  }

  async function handleClone(id: string) {
    cloning = id;
    try {
      await adminPromotionsApi.clone(id);
      loadPromotions();
    } catch (err: unknown) {
      actionError = getErrorMessage(err);
    } finally {
      cloning = null;
    }
  }

  function confirmDelete(promotion: Promotion) {
    deleteTarget = promotion;
    showDeleteDialog = true;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    deleting = true;
    try {
      await adminPromotionsApi.delete(deleteTarget.id);
      showDeleteDialog = false;
      deleteTarget = null;
      loadPromotions();
    } catch (err: unknown) {
      actionError = getErrorMessage(err);
      showDeleteDialog = false;
    } finally {
      deleting = false;
    }
  }

  function cancelDelete() {
    showDeleteDialog = false;
    deleteTarget = null;
  }

</script>

<div>
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <h1 class="text-xl font-semibold text-gray-900">Promotions</h1>
      {#if data}
        <span class="text-sm text-gray-500">{data.total} total</span>
      {/if}
    </div>
    <Button variant="primary" size="sm" onclick={openCreateModal}>
      <Plus class="w-4 h-4" />
      New Promotion
    </Button>
  </div>

  <div class="mb-4 space-y-3">
    <SearchInput
      bind:value={search}
      placeholder="Search promotions..."
      class="max-w-md"
    />

    <!-- Status filter pills -->
    <div class="flex items-center gap-2">
      {#each statusFilters as filter (filter.value)}
        <button
          onclick={() => (statusFilter = filter.value)}
          class="px-3 py-1.5 text-sm font-medium rounded-full transition-colors {statusFilter === filter.value
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
        >
          {filter.label}
        </button>
      {/each}
    </div>
  </div>

  {#if actionError}
    <div class="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4 flex items-center justify-between">
      <span>{actionError}</span>
      <button onclick={() => (actionError = "")} class="text-red-500 hover:text-red-700 text-xs">Dismiss</button>
    </div>
  {/if}

  {#if loading && !data}
    <LoadingSkeleton lines={8} />
  {:else if error}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
  {:else if data && data.items.length === 0}
    <EmptyState title="No promotions found" message={search || statusFilter ? "Try adjusting your search or filter" : "Create your first promotion to start offering discounts"}>
      {#snippet icon()}<Ticket class="w-6 h-6" />{/snippet}
      {#snippet actions()}
        {#if !search && !statusFilter}
          <Button size="sm" onclick={openCreateModal}><Plus class="w-4 h-4" /> New Promotion</Button>
        {/if}
      {/snippet}
    </EmptyState>
  {:else if data}
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Code</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Value</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Usage</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Channels</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.items as promotion (promotion.id)}
              <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3">
                  <a href="/admin/promotions/{promotion.id}" class="font-medium text-gray-900 hover:text-blue-600">
                    {promotion.name}
                  </a>
                </td>
                <td class="px-4 py-3">
                  <span class="font-mono text-xs text-gray-700 uppercase">{promotion.code}</span>
                </td>
                <td class="px-4 py-3 text-gray-600">
                  {promotionTypeLabels[promotion.type] ?? promotion.type}
                </td>
                <td class="px-4 py-3 text-right font-medium text-gray-900">
                  {formatPromotionValue(promotion.type, promotion.value)}
                </td>
                <td class="px-4 py-3">
                  <StatusBadge status={promotion.status} variant="promotion" />
                </td>
                <td class="px-4 py-3 text-right text-gray-600 tabular-nums">
                  {promotion.usageCount}{#if promotion.usageLimitTotal !== null}<span class="text-gray-400"> / {promotion.usageLimitTotal}</span>{/if}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1 flex-wrap">
                    {#each getEnabledChannels(promotion) as channel (channel)}
                      <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                        {channelLabels[channel]}
                      </span>
                    {/each}
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-500">{formatDate(promotion.createdAt)}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <a
                      href="/admin/promotions/{promotion.id}"
                      class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Pencil class="w-4 h-4" />
                    </a>
                    <button
                      onclick={() => handleClone(promotion.id)}
                      class="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                      title="Clone"
                      disabled={cloning === promotion.id}
                    >
                      <Copy class="w-4 h-4" />
                    </button>
                    <button
                      onclick={() => confirmDelete(promotion)}
                      class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
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

<!-- Create Promotion Modal -->
<Modal bind:open={showCreateModal} title="New Promotion">
  <form novalidate onsubmit={(e) => { e.preventDefault(); handleCreate(); }} class="space-y-4">
    {#if createError}
      <div class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{createError}</div>
    {/if}

    <Input
      name="name"
      label="Name"
      bind:value={createName}
      placeholder="Promotion name"
      required
    />

    <div class="space-y-1">
      <label for="code" class="form-label">
        Code
        <span class="text-red-500 ml-0.5">*</span>
      </label>
      <input
        id="code"
        name="code"
        bind:value={createCode}
        oninput={(e) => { createCode = e.currentTarget.value.toUpperCase(); }}
        placeholder="e.g. SUMMER25"
        aria-required="true"
        class="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:ring-0 focus:bg-white focus:border-green-700 text-slate-900 font-medium font-mono uppercase transition-colors rounded-none"
      />
    </div>

    <Select
      name="type"
      label="Type"
      bind:value={createType}
      options={promotionTypeOptions}
    />

    <Input
      name="value"
      label="Value"
      type="number"
      bind:value={createValue}
      placeholder="0"
      required
    />

    <Select
      name="status"
      label="Status"
      bind:value={createStatus}
      options={createStatusOptions}
    />

    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-1">
        <label for="startsAt" class="form-label">Starts At</label>
        <input
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          bind:value={createStartsAt}
          class="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:ring-0 focus:bg-white focus:border-green-700 text-slate-900 font-medium transition-colors rounded-none text-sm"
        />
      </div>
      <div class="space-y-1">
        <label for="endsAt" class="form-label">Ends At</label>
        <input
          id="endsAt"
          name="endsAt"
          type="datetime-local"
          bind:value={createEndsAt}
          class="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:ring-0 focus:bg-white focus:border-green-700 text-slate-900 font-medium transition-colors rounded-none text-sm"
        />
      </div>
    </div>

    <div class="space-y-2">
      <span class="form-label">Channels</span>
      <div class="grid grid-cols-2 gap-2">
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" bind:checked={createBookingEnabled} class="rounded border-gray-300" />
          Booking
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" bind:checked={createEventEnabled} class="rounded border-gray-300" />
          Event
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" bind:checked={createOnlineEnabled} class="rounded border-gray-300" />
          Online
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" bind:checked={createPosEnabled} class="rounded border-gray-300" />
          POS
        </label>
      </div>
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button variant="ghost" type="button" onclick={() => (showCreateModal = false)} disabled={creating}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" disabled={creating}>
        {creating ? "Creating..." : "Create Promotion"}
      </Button>
    </div>
  </form>
</Modal>

<!-- Delete Confirmation -->
<ConfirmDialog
  bind:open={showDeleteDialog}
  title="Delete Promotion"
  message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.` : ""}
  confirmLabel="Delete"
  confirmVariant="danger"
  loading={deleting}
  onConfirm={handleDelete}
  onCancel={cancelDelete}
/>
