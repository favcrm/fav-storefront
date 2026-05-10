<script lang="ts">
  import { untrack } from "svelte";
  import { adminRewardSchemesApi } from "$lib/api/admin";
  import type {
    RewardScheme,
    AdminPaginatedResponse,
    CreateRewardSchemeInput,
    UpdateRewardSchemeInput,
    RewardSchemeType,
  } from "$lib/types/admin";
  import { formatCurrency, formatDate, getErrorMessage } from "$lib/utils/formatting";

  import SearchInput from "$lib/components/ui/SearchInput.svelte";
  import Pagination from "$lib/components/ui/Pagination.svelte";
  import LoadingSkeleton from "$lib/components/ui/LoadingSkeleton.svelte";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import Modal from "$lib/components/ui/Modal.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Select from "$lib/components/ui/Select.svelte";
  import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
  import { Plus, Pencil, Trash2, Copy, Coins, Check } from "lucide-svelte";

  let search = $state("");
  let page = $state(1);
  let loading = $state(true);
  let data = $state<AdminPaginatedResponse<RewardScheme> | null>(null);
  let error = $state("");

  // Modal state
  let modalOpen = $state(false);
  let editingScheme = $state<RewardScheme | null>(null);
  let saving = $state(false);
  let formError = $state("");

  // Form fields
  let formName = $state("");
  let formDescription = $state("");
  let formType = $state("FIXED");
  let formAmount = $state("");
  let formPoints = $state("");
  let formStamps = $state("");
  let formMaxPoints = $state("");
  let formMaxStamps = $state("");
  let formIsDefault = $state(false);

  // Delete state
  let deleteOpen = $state(false);
  let deleteLoading = $state(false);
  let deleteTarget = $state<RewardScheme | null>(null);

  const typeOptions = [
    { value: "FIXED", label: "Fixed" },
    { value: "VARIABLE", label: "Variable" },
  ];

  async function loadData() {
    loading = true;
    error = "";
    try {
      data = await adminRewardSchemesApi.list({
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

  function resetForm() {
    formName = "";
    formDescription = "";
    formType = "FIXED";
    formAmount = "0";
    formPoints = "0";
    formStamps = "0";
    formMaxPoints = "";
    formMaxStamps = "";
    formIsDefault = false;
    formError = "";
  }

  function openCreate() {
    editingScheme = null;
    resetForm();
    modalOpen = true;
  }

  function openEdit(scheme: RewardScheme) {
    editingScheme = scheme;
    formName = scheme.name;
    formDescription = scheme.description ?? "";
    formType = scheme.rewardSchemeType;
    formAmount = String(scheme.amount);
    formPoints = String(scheme.points);
    formStamps = String(scheme.stamps);
    formMaxPoints = scheme.maxPoints != null ? String(scheme.maxPoints) : "";
    formMaxStamps = scheme.maxStamps != null ? String(scheme.maxStamps) : "";
    formIsDefault = scheme.isDefault;
    formError = "";
    modalOpen = true;
  }

  async function handleSave() {
    if (!formName.trim()) {
      formError = "Name is required";
      return;
    }

    saving = true;
    formError = "";
    try {
      const input: CreateRewardSchemeInput = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        rewardSchemeType: formType as RewardSchemeType,
        amount: parseFloat(formAmount) || 0,
        points: parseInt(formPoints, 10) || 0,
        stamps: parseInt(formStamps, 10) || 0,
        maxPoints: formMaxPoints.trim() ? parseInt(formMaxPoints, 10) : null,
        maxStamps: formMaxStamps.trim() ? parseInt(formMaxStamps, 10) : null,
        isDefault: formIsDefault,
      };

      if (editingScheme) {
        await adminRewardSchemesApi.update(editingScheme.id, input as UpdateRewardSchemeInput);
      } else {
        await adminRewardSchemesApi.create(input);
      }

      modalOpen = false;
      await loadData();
    } catch (err: unknown) {
      formError = getErrorMessage(err);
    } finally {
      saving = false;
    }
  }

  async function handleClone(scheme: RewardScheme) {
    try {
      await adminRewardSchemesApi.clone(scheme.id);
      await loadData();
    } catch (err: unknown) {
      error = getErrorMessage(err);
    }
  }

  function openDelete(scheme: RewardScheme) {
    deleteTarget = scheme;
    deleteOpen = true;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    deleteLoading = true;
    try {
      await adminRewardSchemesApi.delete(deleteTarget.id);
      deleteOpen = false;
      deleteTarget = null;
      await loadData();
    } catch (err: unknown) {
      error = getErrorMessage(err);
      deleteOpen = false;
    } finally {
      deleteLoading = false;
    }
  }

  const modalTitle = $derived(editingScheme ? "Edit Earning Rule" : "New Earning Rule");
</script>

<div>
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <h1 class="text-xl font-semibold text-gray-900">Earning Rules</h1>
      {#if data}
        <span class="text-sm text-gray-500">{data.total} total</span>
      {/if}
    </div>
    <Button variant="primary" size="sm" onclick={openCreate}>
      <Plus class="w-4 h-4" />
      New Rule
    </Button>
  </div>

  <div class="mb-4">
    <SearchInput
      bind:value={search}
      placeholder="Search earning rules..."
      class="max-w-md"
    />
  </div>

  {#if loading && !data}
    <LoadingSkeleton lines={8} />
  {:else if error}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
  {:else if data && data.items.length === 0}
    <EmptyState
      title="No earning rules found"
      message={search ? "Try adjusting your search terms" : "Create your first earning rule to start rewarding customers"}
    >
      {#snippet icon()}<Coins class="w-6 h-6" />{/snippet}
      {#snippet actions()}
        {#if !search}
          <Button size="sm" onclick={openCreate}><Plus class="w-4 h-4" /> New Rule</Button>
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
              <th class="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Spend Amount</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Points</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Stamps</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600">Default</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.items as scheme (scheme.id)}
              <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3">
                  <p class="font-medium text-gray-900">{scheme.name}</p>
                  {#if scheme.description}
                    <p class="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{scheme.description}</p>
                  {/if}
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {scheme.rewardSchemeType === 'FIXED' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
                    {scheme.rewardSchemeType}
                  </span>
                </td>
                <td class="px-4 py-3 text-right font-medium text-gray-900 tabular-nums">
                  {formatCurrency(scheme.amount)}
                </td>
                <td class="px-4 py-3 text-right text-gray-700 tabular-nums">{scheme.points}</td>
                <td class="px-4 py-3 text-right text-gray-700 tabular-nums">{scheme.stamps}</td>
                <td class="px-4 py-3 text-center">
                  {#if scheme.isDefault}
                    <Check class="w-4 h-4 text-green-600 inline-block" />
                  {/if}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      onclick={() => openEdit(scheme)}
                      class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Pencil class="w-4 h-4" />
                    </button>
                    <button
                      onclick={() => handleClone(scheme)}
                      class="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                      title="Clone"
                    >
                      <Copy class="w-4 h-4" />
                    </button>
                    <button
                      onclick={() => openDelete(scheme)}
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

<!-- Create / Edit Modal -->
<Modal bind:open={modalOpen} title={modalTitle}>
  <form novalidate onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-4">
    {#if formError}
      <div class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{formError}</div>
    {/if}

    <Input
      name="name"
      label="Name"
      bind:value={formName}
      placeholder="Earning rule name"
      required
    />

    <div class="space-y-1">
      <label for="description" class="form-label">Description</label>
      <textarea
        id="description"
        name="description"
        bind:value={formDescription}
        placeholder="Optional description"
        rows="2"
        class="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:ring-0 focus:bg-white focus:border-green-700 text-slate-900 font-medium transition-colors rounded-none text-sm"
      ></textarea>
    </div>

    <Select
      name="rewardSchemeType"
      label="Type"
      bind:value={formType}
      options={typeOptions}
    />

    <Input
      name="amount"
      label="Spend Amount"
      type="number"
      bind:value={formAmount}
      placeholder="0"
    />

    <div class="grid grid-cols-2 gap-4">
      <Input
        name="points"
        label="Points Earned"
        type="number"
        bind:value={formPoints}
        placeholder="0"
      />
      <Input
        name="stamps"
        label="Stamps Earned"
        type="number"
        bind:value={formStamps}
        placeholder="0"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <Input
        name="maxPoints"
        label="Max Points"
        type="number"
        bind:value={formMaxPoints}
        placeholder="No limit"
      />
      <Input
        name="maxStamps"
        label="Max Stamps"
        type="number"
        bind:value={formMaxStamps}
        placeholder="No limit"
      />
    </div>

    <div class="flex items-center gap-2">
      <input
        type="checkbox"
        id="isDefault"
        bind:checked={formIsDefault}
        class="rounded border-gray-300"
      />
      <label for="isDefault" class="text-sm text-gray-700">Set as default earning rule</label>
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button variant="ghost" type="button" onclick={() => (modalOpen = false)} disabled={saving}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" disabled={saving}>
        {saving ? "Saving..." : editingScheme ? "Save Changes" : "Create Rule"}
      </Button>
    </div>
  </form>
</Modal>

<!-- Delete Confirmation -->
<ConfirmDialog
  bind:open={deleteOpen}
  title="Delete Earning Rule"
  message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.` : ""}
  confirmLabel="Delete"
  confirmVariant="danger"
  loading={deleteLoading}
  onConfirm={handleDelete}
  onCancel={() => { deleteOpen = false; deleteTarget = null; }}
/>
