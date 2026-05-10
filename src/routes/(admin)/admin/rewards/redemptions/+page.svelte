<script lang="ts">
  import { untrack } from "svelte";
  import { adminRewardRedemptionsApi } from "$lib/api/admin";
  import type {
    RewardRedemption,
    AdminPaginatedResponse,
    CreateRewardRedemptionInput,
  } from "$lib/types/admin";
  import { formatDate, getErrorMessage } from "$lib/utils/formatting";

  import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
  import SearchInput from "$lib/components/ui/SearchInput.svelte";
  import Pagination from "$lib/components/ui/Pagination.svelte";
  import LoadingSkeleton from "$lib/components/ui/LoadingSkeleton.svelte";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import Modal from "$lib/components/ui/Modal.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
  import { Plus, Trash2, Ticket } from "lucide-svelte";

  let search = $state("");
  let page = $state(1);
  let loading = $state(true);
  let data = $state<AdminPaginatedResponse<RewardRedemption> | null>(null);
  let error = $state("");

  // Create modal
  let showCreateModal = $state(false);
  let creating = $state(false);
  let createError = $state("");
  let createAccountId = $state("");
  let createGiftOfferId = $state("");
  let createExpiresAt = $state("");

  // Delete state
  let showDeleteDialog = $state(false);
  let deleting = $state(false);
  let deleteTarget = $state<RewardRedemption | null>(null);

  async function loadData() {
    loading = true;
    error = "";
    try {
      data = await adminRewardRedemptionsApi.list({
        page,
        pageSize: 20,
        search: search || undefined,
        ordering: "-createdAt",
      });
    } catch (err: unknown) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  }

  let prevSearch = "";

  $effect(() => {
    const s = search;
    if (s !== prevSearch) {
      prevSearch = s;
      page = 1;
    }
    page;
    untrack(() => { loadData(); });
  });

  function resetCreateForm() {
    createAccountId = "";
    createGiftOfferId = "";
    createExpiresAt = "";
    createError = "";
  }

  function openCreateModal() {
    resetCreateForm();
    showCreateModal = true;
  }

  async function handleCreate() {
    if (!createAccountId.trim()) {
      createError = "Member ID is required";
      return;
    }
    if (!createGiftOfferId.trim()) {
      createError = "Gift Offer ID is required";
      return;
    }

    creating = true;
    createError = "";
    try {
      const input: CreateRewardRedemptionInput = {
        accountId: createAccountId.trim(),
        giftOfferId: createGiftOfferId.trim(),
      };
      if (createExpiresAt) {
        input.expiresAt = new Date(createExpiresAt).toISOString();
      }

      await adminRewardRedemptionsApi.create(input);
      showCreateModal = false;
      await loadData();
    } catch (err: unknown) {
      createError = getErrorMessage(err);
    } finally {
      creating = false;
    }
  }

  function confirmDelete(redemption: RewardRedemption) {
    deleteTarget = redemption;
    showDeleteDialog = true;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    deleting = true;
    try {
      await adminRewardRedemptionsApi.delete(deleteTarget.id);
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
      <h1 class="text-xl font-semibold text-gray-900">Redemptions</h1>
      {#if data}
        <span class="text-sm text-gray-500">{data.total} total</span>
      {/if}
    </div>
    <Button variant="primary" size="sm" onclick={openCreateModal}>
      <Plus class="w-4 h-4" />
      Issue Reward
    </Button>
  </div>

  <div class="mb-4">
    <SearchInput
      bind:value={search}
      placeholder="Search redemptions..."
      class="max-w-md"
    />
  </div>

  {#if loading && !data}
    <LoadingSkeleton lines={8} />
  {:else if error}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
  {:else if data && data.items.length === 0}
    <EmptyState
      title="No redemptions found"
      message={search ? "Try adjusting your search terms" : "Issue rewards to members to see them here"}
    >
      {#snippet icon()}<Ticket class="w-6 h-6" />{/snippet}
      {#snippet actions()}
        {#if !search}
          <Button size="sm" onclick={openCreateModal}><Plus class="w-4 h-4" /> Issue Reward</Button>
        {/if}
      {/snippet}
    </EmptyState>
  {:else if data}
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="text-left px-4 py-3 font-medium text-gray-600">Member</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Gift Offer</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Coupon Code</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Expires At</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.items as redemption (redemption.id)}
              <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3">
                  <p class="font-medium text-gray-900">{redemption.accountName ?? redemption.accountId}</p>
                </td>
                <td class="px-4 py-3 text-gray-700">
                  {redemption.giftOfferName ?? redemption.giftOfferId}
                </td>
                <td class="px-4 py-3">
                  {#if redemption.couponCode}
                    <code class="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-mono">
                      {redemption.couponCode}
                    </code>
                  {:else}
                    <span class="text-gray-400">—</span>
                  {/if}
                </td>
                <td class="px-4 py-3">
                  <StatusBadge status={redemption.status} variant="redemption" />
                </td>
                <td class="px-4 py-3 text-gray-500">
                  {redemption.expiresAt ? formatDate(redemption.expiresAt) : "—"}
                </td>
                <td class="px-4 py-3 text-gray-500">
                  {formatDate(redemption.createdAt)}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1">
                    {#if redemption.status === "VALID"}
                      <button
                        onclick={() => confirmDelete(redemption)}
                        class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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

<!-- Issue Reward Modal -->
<Modal bind:open={showCreateModal} title="Issue Reward">
  <form novalidate onsubmit={(e) => { e.preventDefault(); handleCreate(); }} class="space-y-4">
    {#if createError}
      <div class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{createError}</div>
    {/if}

    <Input
      name="accountId"
      label="Member ID"
      bind:value={createAccountId}
      placeholder="Enter member account ID"
      required
    />

    <Input
      name="giftOfferId"
      label="Gift Offer ID"
      bind:value={createGiftOfferId}
      placeholder="Enter gift offer ID"
      required
    />

    <Input
      name="expiresAt"
      label="Expires At (optional)"
      type="datetime-local"
      bind:value={createExpiresAt}
    />

    <div class="flex justify-end gap-2 pt-2">
      <Button variant="ghost" type="button" onclick={() => (showCreateModal = false)} disabled={creating}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" disabled={creating}>
        {creating ? "Issuing..." : "Issue Reward"}
      </Button>
    </div>
  </form>
</Modal>

<!-- Delete Confirmation -->
<ConfirmDialog
  bind:open={showDeleteDialog}
  title="Delete Redemption"
  message={deleteTarget ? `Are you sure you want to delete this redemption for "${deleteTarget.accountName ?? deleteTarget.accountId}"? This action cannot be undone.` : ""}
  confirmLabel="Delete"
  confirmVariant="danger"
  loading={deleting}
  onConfirm={handleDelete}
  onCancel={() => { showDeleteDialog = false; deleteTarget = null; }}
/>
