<script lang="ts">
  import { untrack } from "svelte";
  import { adminGiftOffersApi } from "$lib/api/admin";
  import type {
    GiftOffer,
    AdminPaginatedResponse,
    CreateGiftOfferInput,
    GiftOfferStatus,
  } from "$lib/types/admin";
  import { formatDate, getErrorMessage } from "$lib/utils/formatting";
  import { faceValueTypeOptions, formatFaceValue } from "$lib/utils/admin-helpers";

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
  import { Plus, Pencil, Trash2, Gift } from "lucide-svelte";

  let search = $state("");
  let statusFilter = $state("");
  let page = $state(1);
  let loading = $state(true);
  let data = $state<AdminPaginatedResponse<GiftOffer> | null>(null);
  let error = $state("");

  // Create modal
  let showCreateModal = $state(false);
  let creating = $state(false);
  let createError = $state("");
  let createName = $state("");
  let createStatus = $state("DRAFT");
  let createPoints = $state("0");
  let createStamps = $state("0");
  let createIsRedeemable = $state(true);
  let createFaceValue = $state("");
  let createFaceValueType = $state("AMOUNT");

  // Delete state
  let showDeleteDialog = $state(false);
  let deleting = $state(false);
  let deleteTarget = $state<GiftOffer | null>(null);

  const statusFilterOptions = [
    { value: "", label: "All" },
    { value: "DRAFT", label: "Draft" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "ARCHIVED", label: "Archived" },
  ];

  const createStatusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "ACTIVE", label: "Active" },
  ];

  async function loadData() {
    loading = true;
    error = "";
    try {
      data = await adminGiftOffersApi.list({
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
    untrack(() => { loadData(); });
  });

  function resetCreateForm() {
    createName = "";
    createStatus = "DRAFT";
    createPoints = "0";
    createStamps = "0";
    createIsRedeemable = true;
    createFaceValue = "";
    createFaceValueType = "AMOUNT";
    createError = "";
  }

  function openCreateModal() {
    resetCreateForm();
    showCreateModal = true;
  }

  async function handleCreate() {
    if (!createName.trim()) {
      createError = "Name is required";
      return;
    }

    creating = true;
    createError = "";
    try {
      const input: CreateGiftOfferInput = {
        name: createName.trim(),
        status: createStatus as GiftOfferStatus,
        points: parseInt(createPoints, 10) || 0,
        stamps: parseInt(createStamps, 10) || 0,
        isRedeemable: createIsRedeemable,
      };
      if (createFaceValue.trim()) {
        input.faceValue = parseFloat(createFaceValue);
        input.faceValueType = createFaceValueType as "PERCENTAGE" | "AMOUNT";
      }

      await adminGiftOffersApi.create(input);
      showCreateModal = false;
      await loadData();
    } catch (err: unknown) {
      createError = getErrorMessage(err);
    } finally {
      creating = false;
    }
  }

  function confirmDelete(offer: GiftOffer) {
    deleteTarget = offer;
    showDeleteDialog = true;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    deleting = true;
    try {
      await adminGiftOffersApi.delete(deleteTarget.id);
      showDeleteDialog = false;
      deleteTarget = null;
      await loadData();
    } catch (err: unknown) {
      error = getErrorMessage(err);
      showDeleteDialog = false;
    } finally {
      deleting = false;
    }
  }

</script>

<div>
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <h1 class="text-xl font-semibold text-gray-900">Gift Offers</h1>
      {#if data}
        <span class="text-sm text-gray-500">{data.total} total</span>
      {/if}
    </div>
    <Button variant="primary" size="sm" onclick={openCreateModal}>
      <Plus class="w-4 h-4" />
      New Gift Offer
    </Button>
  </div>

  <div class="flex items-center gap-4 mb-4">
    <SearchInput
      bind:value={search}
      placeholder="Search gift offers..."
      class="max-w-md"
    />
    <Select
      name="statusFilter"
      bind:value={statusFilter}
      options={statusFilterOptions}
    />
  </div>

  {#if loading && !data}
    <LoadingSkeleton lines={8} />
  {:else if error}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
  {:else if data && data.items.length === 0}
    <EmptyState
      title="No gift offers found"
      message={search || statusFilter ? "Try adjusting your filters" : "Create gift offers for your loyalty program"}
    >
      {#snippet icon()}<Gift class="w-6 h-6" />{/snippet}
      {#snippet actions()}
        {#if !search && !statusFilter}
          <Button size="sm" onclick={openCreateModal}><Plus class="w-4 h-4" /> New Gift Offer</Button>
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
              <th class="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Points Cost</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Stamps Cost</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600">Redeemable</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Quota</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Face Value</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.items as offer (offer.id)}
              <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3">
                  <a
                    href="/admin/rewards/gift-offers/{offer.id}"
                    class="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {offer.name}
                  </a>
                  {#if offer.description}
                    <p class="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{offer.description}</p>
                  {/if}
                </td>
                <td class="px-4 py-3">
                  <StatusBadge status={offer.status} variant="giftOffer" />
                </td>
                <td class="px-4 py-3 text-right text-gray-700 tabular-nums">{offer.points}</td>
                <td class="px-4 py-3 text-right text-gray-700 tabular-nums">{offer.stamps}</td>
                <td class="px-4 py-3 text-center text-gray-700">
                  {offer.isRedeemable ? "Yes" : "No"}
                </td>
                <td class="px-4 py-3 text-right text-gray-500 text-xs">
                  {#if offer.quota != null || offer.quotaPerMember != null}
                    {offer.quota ?? "—"} / {offer.quotaPerMember ?? "—"} per member
                  {:else}
                    Unlimited
                  {/if}
                </td>
                <td class="px-4 py-3 text-right font-medium text-gray-900">
                  {formatFaceValue(offer)}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <a
                      href="/admin/rewards/gift-offers/{offer.id}"
                      class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Pencil class="w-4 h-4" />
                    </a>
                    <button
                      onclick={() => confirmDelete(offer)}
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

<!-- Create Modal -->
<Modal bind:open={showCreateModal} title="New Gift Offer">
  <form novalidate onsubmit={(e) => { e.preventDefault(); handleCreate(); }} class="space-y-4">
    {#if createError}
      <div class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{createError}</div>
    {/if}

    <Input
      name="name"
      label="Name"
      bind:value={createName}
      placeholder="Gift offer name"
      required
    />

    <Select
      name="status"
      label="Status"
      bind:value={createStatus}
      options={createStatusOptions}
    />

    <div class="grid grid-cols-2 gap-4">
      <Input
        name="points"
        label="Points Cost"
        type="number"
        bind:value={createPoints}
        placeholder="0"
      />
      <Input
        name="stamps"
        label="Stamps Cost"
        type="number"
        bind:value={createStamps}
        placeholder="0"
      />
    </div>

    <div class="flex items-center gap-2">
      <input
        type="checkbox"
        id="isRedeemable"
        bind:checked={createIsRedeemable}
        class="rounded border-gray-300"
      />
      <label for="isRedeemable" class="text-sm text-gray-700">Redeemable by members</label>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <Input
        name="faceValue"
        label="Face Value"
        type="number"
        bind:value={createFaceValue}
        placeholder="0"
      />
      <Select
        name="faceValueType"
        label="Value Type"
        bind:value={createFaceValueType}
        options={faceValueTypeOptions}
      />
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button variant="ghost" type="button" onclick={() => (showCreateModal = false)} disabled={creating}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" disabled={creating}>
        {creating ? "Creating..." : "Create Gift Offer"}
      </Button>
    </div>
  </form>
</Modal>

<!-- Delete Confirmation -->
<ConfirmDialog
  bind:open={showDeleteDialog}
  title="Delete Gift Offer"
  message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.` : ""}
  confirmLabel="Delete"
  confirmVariant="danger"
  loading={deleting}
  onConfirm={handleDelete}
  onCancel={() => { showDeleteDialog = false; deleteTarget = null; }}
/>
