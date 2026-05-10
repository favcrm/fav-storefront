<script lang="ts">
  import { onMount } from "svelte";
  import { adminTiersApi } from "$lib/api/admin";
  import type { MembershipTier, AdminPaginatedResponse, CreateTierInput } from "$lib/types/admin";
  import { formatCurrency } from "$lib/utils/formatting";
  import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
  import LoadingSkeleton from "$lib/components/ui/LoadingSkeleton.svelte";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import Modal from "$lib/components/ui/Modal.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Select from "$lib/components/ui/Select.svelte";
  import Checkbox from "$lib/components/ui/Checkbox.svelte";
  import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
  import { Pencil, Trash2, Plus, Crown } from "lucide-svelte";

  let loading = $state(true);
  let data = $state<AdminPaginatedResponse<MembershipTier> | null>(null);
  let error = $state("");

  // Modal state
  let modalOpen = $state(false);
  let editingTier = $state<MembershipTier | null>(null);
  let saving = $state(false);
  let formError = $state("");

  // Form fields
  let formName = $state("");
  let formStatus = $state("ACTIVE");
  let formPrice = $state("0");
  let formValidPeriodValue = $state("12");
  let formValidPeriodUnit = $state("MONTHS");
  let formDiscount = $state("0");
  let formMultiplier = $state("1");
  let formIsUpgradeable = $state(false);
  let formIsPopular = $state(false);
  let formBenefits = $state("");

  // Delete state
  let deleteDialogOpen = $state(false);
  let deletingTier = $state<MembershipTier | null>(null);
  let deleting = $state(false);

  let modalTitle = $derived(editingTier ? "Edit Tier" : "Add Tier");

  const statusOptions = [
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
  ];

  const periodUnitOptions = [
    { value: "MONTHS", label: "Months" },
    { value: "YEARS", label: "Years" },
  ];

  onMount(() => { loadTiers(); });

  async function loadTiers() {
    loading = true;
    error = "";
    try {
      data = await adminTiersApi.list({ pageSize: 50, ordering: "sortOrder" });
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to load membership tiers";
    } finally {
      loading = false;
    }
  }

  function formatValidity(value: number, unit: string): string {
    return `${value} ${unit.toLowerCase()}`;
  }

  function resetForm() {
    formName = "";
    formStatus = "ACTIVE";
    formPrice = "0";
    formValidPeriodValue = "12";
    formValidPeriodUnit = "MONTHS";
    formDiscount = "0";
    formMultiplier = "1";
    formIsUpgradeable = false;
    formIsPopular = false;
    formBenefits = "";
    formError = "";
  }

  function openCreateModal() {
    editingTier = null;
    resetForm();
    modalOpen = true;
  }

  function openEditModal(tier: MembershipTier) {
    editingTier = tier;
    formName = tier.name;
    formStatus = tier.status;
    formPrice = String(tier.price);
    formValidPeriodValue = String(tier.validPeriodValue);
    formValidPeriodUnit = tier.validPeriodUnit;
    formDiscount = String(tier.discount);
    formMultiplier = String(tier.multiplier);
    formIsUpgradeable = tier.isUpgradeable;
    formIsPopular = tier.isPopular;
    formBenefits = tier.benefits.join(", ");
    formError = "";
    modalOpen = true;
  }

  function openDeleteDialog(tier: MembershipTier) {
    deletingTier = tier;
    deleteDialogOpen = true;
  }

  function buildFormData(): CreateTierInput {
    const benefits = formBenefits
      .split(",")
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    return {
      name: formName.trim(),
      status: formStatus as "ACTIVE" | "INACTIVE",
      price: Number(formPrice),
      validPeriodValue: Number(formValidPeriodValue),
      validPeriodUnit: formValidPeriodUnit as "MONTHS" | "YEARS",
      discount: Number(formDiscount),
      multiplier: Number(formMultiplier),
      isUpgradeable: formIsUpgradeable,
      isPopular: formIsPopular,
      benefits,
    };
  }

  async function handleSave() {
    if (!formName.trim()) {
      formError = "Name is required";
      return;
    }

    saving = true;
    formError = "";

    try {
      const payload = buildFormData();
      if (editingTier) {
        await adminTiersApi.update(editingTier.id, payload);
      } else {
        await adminTiersApi.create(payload);
      }
      modalOpen = false;
      await loadTiers();
    } catch (err: unknown) {
      formError = err instanceof Error ? err.message : "Failed to save tier";
    } finally {
      saving = false;
    }
  }

  async function handleDelete() {
    if (!deletingTier) return;

    deleting = true;
    try {
      await adminTiersApi.delete(deletingTier.id);
      deleteDialogOpen = false;
      deletingTier = null;
      await loadTiers();
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to delete tier";
      deleteDialogOpen = false;
      deletingTier = null;
    } finally {
      deleting = false;
    }
  }
</script>

<div>
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-semibold text-gray-900">Membership Tiers</h1>
    <div class="flex items-center gap-3">
      {#if data}
        <span class="text-sm text-gray-500">{data.total} tiers</span>
      {/if}
      <Button variant="primary" size="sm" onclick={openCreateModal}>
        <Plus class="w-4 h-4" />
        Add Tier
      </Button>
    </div>
  </div>

  {#if loading}
    <LoadingSkeleton lines={6} />
  {:else if error}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
  {:else if data && data.items.length === 0}
    <EmptyState title="No membership tiers" message="Create tiers to offer loyalty programs to your customers">
      {#snippet icon()}<Crown class="w-6 h-6" />{/snippet}
      {#snippet actions()}
        <Button size="sm" onclick={openCreateModal}><Plus class="w-4 h-4" /> Add Tier</Button>
      {/snippet}
    </EmptyState>
  {:else if data}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each data.items as tier (tier.id)}
        <div class="bg-white rounded-lg border border-gray-200 p-5 relative">
          {#if tier.isPopular}
            <span class="absolute top-3 right-3 bg-amber-100 text-amber-800 text-[10px] font-medium px-2 py-0.5 rounded-full">
              Popular
            </span>
          {/if}

          <div class="flex items-center gap-2 mb-3">
            <h2 class="font-semibold text-gray-900">{tier.name}</h2>
            <StatusBadge status={tier.status} variant="tier" />
          </div>

          <div class="text-2xl font-bold text-gray-900 mb-1">
            {tier.price > 0 ? formatCurrency(tier.price) : "Free"}
          </div>
          <p class="text-xs text-gray-500 mb-4">
            Valid for {formatValidity(tier.validPeriodValue, tier.validPeriodUnit)}
          </p>

          <dl class="text-sm space-y-2 mb-4">
            {#if tier.discount > 0}
              <div class="flex justify-between">
                <dt class="text-gray-500">Discount</dt>
                <dd class="text-gray-700">{tier.discount}%</dd>
              </div>
            {/if}
            {#if tier.multiplier > 1}
              <div class="flex justify-between">
                <dt class="text-gray-500">Points Multiplier</dt>
                <dd class="text-gray-700">{tier.multiplier}x</dd>
              </div>
            {/if}
            <div class="flex justify-between">
              <dt class="text-gray-500">Members</dt>
              <dd class="font-medium text-gray-900">{tier.memberCount}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Upgradeable</dt>
              <dd class="text-gray-700">{tier.isUpgradeable ? "Yes" : "No"}</dd>
            </div>
          </dl>

          {#if tier.benefits.length > 0}
            <div class="border-t border-gray-100 pt-3 mb-4">
              <p class="text-xs font-medium text-gray-500 mb-2">Benefits</p>
              <ul class="space-y-1">
                {#each tier.benefits as benefit}
                  <li class="text-xs text-gray-600 flex items-start gap-1.5">
                    <span class="text-green-500 mt-0.5">&#10003;</span>
                    {benefit}
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          <div class="flex items-center gap-2 pt-3 border-t border-gray-100">
            <Button variant="ghost" size="sm" onclick={() => openEditModal(tier)}>
              <Pencil class="w-3.5 h-3.5" />
              Edit
            </Button>
            <Button variant="ghost" size="sm" onclick={() => openDeleteDialog(tier)}>
              <Trash2 class="w-3.5 h-3.5 text-red-500" />
              <span class="text-red-500">Delete</span>
            </Button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Create / Edit Modal -->
<Modal bind:open={modalOpen} title={modalTitle}>
  <form novalidate
    onsubmit={(e) => { e.preventDefault(); handleSave(); }}
    class="space-y-4"
  >
    <Input
      name="tierName"
      label="Name"
      bind:value={formName}
      required
      placeholder="e.g. Gold, Silver, Platinum"
    />

    <Select
      name="tierStatus"
      label="Status"
      bind:value={formStatus}
      options={statusOptions}
    />

    <div class="grid grid-cols-2 gap-4">
      <Input
        name="tierPrice"
        label="Price"
        type="number"
        bind:value={formPrice}
        placeholder="0"
      />

      <Input
        name="tierDiscount"
        label="Discount (%)"
        type="number"
        bind:value={formDiscount}
        placeholder="0"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <Input
        name="tierValidPeriodValue"
        label="Valid Period"
        type="number"
        bind:value={formValidPeriodValue}
        placeholder="12"
      />

      <Select
        name="tierValidPeriodUnit"
        label="Period Unit"
        bind:value={formValidPeriodUnit}
        options={periodUnitOptions}
      />
    </div>

    <Input
      name="tierMultiplier"
      label="Points Multiplier"
      type="number"
      bind:value={formMultiplier}
      placeholder="1"
    />

    <div class="flex gap-6">
      <Checkbox
        name="tierIsUpgradeable"
        label="Upgradeable"
        bind:checked={formIsUpgradeable}
      />

      <Checkbox
        name="tierIsPopular"
        label="Popular"
        bind:checked={formIsPopular}
      />
    </div>

    <Input
      name="tierBenefits"
      label="Benefits"
      bind:value={formBenefits}
      placeholder="Free shipping, 10% off, Priority support"
      hint="Separate multiple benefits with commas"
    />

    {#if formError}
      <p class="text-sm text-red-600">{formError}</p>
    {/if}

    <div class="flex justify-end gap-2 pt-2">
      <Button variant="ghost" type="button" onclick={() => (modalOpen = false)}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" disabled={saving}>
        {saving ? "Saving..." : editingTier ? "Update Tier" : "Create Tier"}
      </Button>
    </div>
  </form>
</Modal>

<!-- Delete Confirmation Dialog -->
<ConfirmDialog
  bind:open={deleteDialogOpen}
  title="Delete Tier"
  message={deletingTier ? `Are you sure you want to delete "${deletingTier.name}"? This action cannot be undone.` : ""}
  confirmLabel="Delete"
  confirmVariant="danger"
  loading={deleting}
  onConfirm={handleDelete}
  onCancel={() => { deleteDialogOpen = false; deletingTier = null; }}
/>
