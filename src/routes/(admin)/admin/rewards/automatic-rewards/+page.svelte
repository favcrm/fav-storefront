<script lang="ts">
  import { untrack } from "svelte";
  import { adminAutomaticRewardsApi } from "$lib/api/admin";
  import type {
    AutomaticReward,
    AdminPaginatedResponse,
    CreateAutomaticRewardInput,
    AutomaticRewardStatus,
    AutomaticRewardTrigger,
    AutomaticRewardRepeat,
  } from "$lib/types/admin";
  import { formatDate, getErrorMessage } from "$lib/utils/formatting";
  import { triggerLabels, triggerOptions, repeatOptions } from "$lib/utils/admin-helpers";

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
  import { Plus, Pencil, Trash2, Zap } from "lucide-svelte";

  let search = $state("");
  let statusFilter = $state("");
  let page = $state(1);
  let loading = $state(true);
  let data = $state<AdminPaginatedResponse<AutomaticReward> | null>(null);
  let error = $state("");

  // Create modal
  let showCreateModal = $state(false);
  let creating = $state(false);
  let createError = $state("");
  let createName = $state("");
  let createTrigger = $state("NEW_MEMBER_REGISTERED");
  let createStatus = $state("ACTIVE");
  let createRepeat = $state("NONE");
  let createBonusPoints = $state("0");
  let createBonusStamps = $state("0");

  // Delete state
  let showDeleteDialog = $state(false);
  let deleting = $state(false);
  let deleteTarget = $state<AutomaticReward | null>(null);

  const statusOptions = [
    { value: "ACTIVE", label: "Active" },
    { value: "DISABLED", label: "Disabled" },
  ];

  const statusFilterOptions = [
    { value: "", label: "All" },
    { value: "ACTIVE", label: "Active" },
    { value: "DISABLED", label: "Disabled" },
  ];

  async function loadData() {
    loading = true;
    error = "";
    try {
      data = await adminAutomaticRewardsApi.list({
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
    createTrigger = "NEW_MEMBER_REGISTERED";
    createStatus = "ACTIVE";
    createRepeat = "NONE";
    createBonusPoints = "0";
    createBonusStamps = "0";
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
      const input: CreateAutomaticRewardInput = {
        name: createName.trim(),
        trigger: createTrigger as AutomaticRewardTrigger,
        status: createStatus as AutomaticRewardStatus,
        repeat: createRepeat as AutomaticRewardRepeat,
        bonusPoints: parseInt(createBonusPoints, 10) || 0,
        bonusStamps: parseInt(createBonusStamps, 10) || 0,
      };

      await adminAutomaticRewardsApi.create(input);
      showCreateModal = false;
      await loadData();
    } catch (err: unknown) {
      createError = getErrorMessage(err);
    } finally {
      creating = false;
    }
  }

  function confirmDelete(reward: AutomaticReward) {
    deleteTarget = reward;
    showDeleteDialog = true;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    deleting = true;
    try {
      await adminAutomaticRewardsApi.delete(deleteTarget.id);
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
      <h1 class="text-xl font-semibold text-gray-900">Automatic Rewards</h1>
      {#if data}
        <span class="text-sm text-gray-500">{data.total} total</span>
      {/if}
    </div>
    <Button variant="primary" size="sm" onclick={openCreateModal}>
      <Plus class="w-4 h-4" />
      New Auto Reward
    </Button>
  </div>

  <div class="flex items-center gap-4 mb-4">
    <SearchInput
      bind:value={search}
      placeholder="Search automatic rewards..."
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
      title="No automatic rewards found"
      message={search || statusFilter ? "Try adjusting your filters" : "Create automatic rewards to engage members"}
    >
      {#snippet icon()}<Zap class="w-6 h-6" />{/snippet}
      {#snippet actions()}
        {#if !search && !statusFilter}
          <Button size="sm" onclick={openCreateModal}><Plus class="w-4 h-4" /> New Auto Reward</Button>
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
              <th class="text-left px-4 py-3 font-medium text-gray-600">Trigger</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Repeat</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Bonus Points</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Bonus Stamps</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.items as reward (reward.id)}
              <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3">
                  <a
                    href="/admin/rewards/automatic-rewards/{reward.id}"
                    class="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {reward.name}
                  </a>
                </td>
                <td class="px-4 py-3 text-gray-700">
                  {triggerLabels[reward.trigger] ?? reward.trigger}
                </td>
                <td class="px-4 py-3">
                  <StatusBadge status={reward.status} variant="automaticReward" />
                </td>
                <td class="px-4 py-3 text-gray-500">
                  {reward.repeat === "NONE" ? "—" : reward.repeat.charAt(0) + reward.repeat.slice(1).toLowerCase()}
                </td>
                <td class="px-4 py-3 text-right text-gray-700 tabular-nums">{reward.bonusPoints}</td>
                <td class="px-4 py-3 text-right text-gray-700 tabular-nums">{reward.bonusStamps}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <a
                      href="/admin/rewards/automatic-rewards/{reward.id}"
                      class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Pencil class="w-4 h-4" />
                    </a>
                    <button
                      onclick={() => confirmDelete(reward)}
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
<Modal bind:open={showCreateModal} title="New Automatic Reward">
  <form novalidate onsubmit={(e) => { e.preventDefault(); handleCreate(); }} class="space-y-4">
    {#if createError}
      <div class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{createError}</div>
    {/if}

    <Input
      name="name"
      label="Name"
      bind:value={createName}
      placeholder="Automatic reward name"
      required
    />

    <Select
      name="trigger"
      label="Trigger"
      bind:value={createTrigger}
      options={triggerOptions}
    />

    <Select
      name="status"
      label="Status"
      bind:value={createStatus}
      options={statusOptions}
    />

    <Select
      name="repeat"
      label="Repeat"
      bind:value={createRepeat}
      options={repeatOptions}
    />

    <div class="grid grid-cols-2 gap-4">
      <Input
        name="bonusPoints"
        label="Bonus Points"
        type="number"
        bind:value={createBonusPoints}
        placeholder="0"
      />
      <Input
        name="bonusStamps"
        label="Bonus Stamps"
        type="number"
        bind:value={createBonusStamps}
        placeholder="0"
      />
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button variant="ghost" type="button" onclick={() => (showCreateModal = false)} disabled={creating}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" disabled={creating}>
        {creating ? "Creating..." : "Create Auto Reward"}
      </Button>
    </div>
  </form>
</Modal>

<!-- Delete Confirmation -->
<ConfirmDialog
  bind:open={showDeleteDialog}
  title="Delete Automatic Reward"
  message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.` : ""}
  confirmLabel="Delete"
  confirmVariant="danger"
  loading={deleting}
  onConfirm={handleDelete}
  onCancel={() => { showDeleteDialog = false; deleteTarget = null; }}
/>
