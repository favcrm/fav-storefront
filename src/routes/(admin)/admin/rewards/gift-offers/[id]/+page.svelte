<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { adminGiftOffersApi } from "$lib/api/admin";
  import type { GiftOfferDetail, UpdateGiftOfferInput, GiftOfferStatus } from "$lib/types/admin";
  import { formatDate, getErrorMessage } from "$lib/utils/formatting";
  import { faceValueTypeOptions, formatFaceValue } from "$lib/utils/admin-helpers";

  import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
  import LoadingSkeleton from "$lib/components/ui/LoadingSkeleton.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Select from "$lib/components/ui/Select.svelte";
  import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
  import { Pencil, Trash2, Upload } from "lucide-svelte";

  let offer = $state<GiftOfferDetail | null>(null);
  let loading = $state(true);
  let error = $state("");

  // Edit mode
  let editing = $state(false);
  let saving = $state(false);
  let editError = $state("");
  let editName = $state("");
  let editDescription = $state("");
  let editStatus = $state("");
  let editPoints = $state("");
  let editStamps = $state("");
  let editIsRedeemable = $state(true);
  let editFaceValue = $state("");
  let editFaceValueType = $state("AMOUNT");
  let editQuota = $state("");
  let editQuotaPerMember = $state("");
  let editTermsAndConditions = $state("");
  let editExpiryPeriod = $state("");
  let editExpiryPeriodUnit = $state("");
  let editStartDate = $state("");
  let editEndDate = $state("");

  // Image upload
  let uploading = $state(false);

  // Delete
  let showDeleteDialog = $state(false);
  let deleting = $state(false);

  const statusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "ARCHIVED", label: "Archived" },
  ];

  const expiryUnitOptions = [
    { value: "", label: "No Expiry" },
    { value: "DAYS", label: "Days" },
    { value: "WEEKS", label: "Weeks" },
    { value: "MONTHS", label: "Months" },
    { value: "YEARS", label: "Years" },
  ];

  onMount(() => {
    loadOffer();
  });

  async function loadOffer() {
    loading = true;
    error = "";
    try {
      offer = await adminGiftOffersApi.get($page.params.id!);
    } catch (err: unknown) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  }

  function enterEditMode() {
    if (!offer) return;
    editName = offer.name;
    editDescription = offer.description ?? "";
    editStatus = offer.status;
    editPoints = String(offer.points);
    editStamps = String(offer.stamps);
    editIsRedeemable = offer.isRedeemable;
    editFaceValue = offer.faceValue != null ? String(offer.faceValue) : "";
    editFaceValueType = offer.faceValueType ?? "AMOUNT";
    editQuota = offer.quota != null ? String(offer.quota) : "";
    editQuotaPerMember = offer.quotaPerMember != null ? String(offer.quotaPerMember) : "";
    editTermsAndConditions = offer.termsAndConditions ?? "";
    editExpiryPeriod = offer.expiryPeriod != null ? String(offer.expiryPeriod) : "";
    editExpiryPeriodUnit = offer.expiryPeriodUnit ?? "";
    editStartDate = offer.startDate ?? "";
    editEndDate = offer.endDate ?? "";
    editError = "";
    editing = true;
  }

  function cancelEdit() {
    editing = false;
    editError = "";
  }

  async function handleSave() {
    if (!offer) return;
    if (!editName.trim()) {
      editError = "Name is required";
      return;
    }

    saving = true;
    editError = "";
    try {
      const input: UpdateGiftOfferInput = {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        status: editStatus as GiftOfferStatus,
        points: parseInt(editPoints, 10) || 0,
        stamps: parseInt(editStamps, 10) || 0,
        isRedeemable: editIsRedeemable,
        faceValue: editFaceValue.trim() ? parseFloat(editFaceValue) : null,
        faceValueType: editFaceValue.trim() ? (editFaceValueType as "PERCENTAGE" | "AMOUNT") : null,
        quota: editQuota.trim() ? parseInt(editQuota, 10) : null,
        quotaPerMember: editQuotaPerMember.trim() ? parseInt(editQuotaPerMember, 10) : null,
        termsAndConditions: editTermsAndConditions.trim() || undefined,
        expiryPeriod: editExpiryPeriod.trim() ? parseInt(editExpiryPeriod, 10) : null,
        expiryPeriodUnit: editExpiryPeriodUnit || null,
        startDate: editStartDate || null,
        endDate: editEndDate || null,
      };

      await adminGiftOffersApi.update(offer.id, input);
      editing = false;
      await loadOffer();
    } catch (err: unknown) {
      editError = getErrorMessage(err);
    } finally {
      saving = false;
    }
  }

  async function handleImageUpload(e: Event) {
    if (!offer) return;
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    uploading = true;
    try {
      await adminGiftOffersApi.uploadImage(offer.id, file);
      await loadOffer();
    } catch (err: unknown) {
      error = getErrorMessage(err);
    } finally {
      uploading = false;
      input.value = "";
    }
  }

  async function handleDelete() {
    if (!offer) return;
    deleting = true;
    try {
      await adminGiftOffersApi.delete(offer.id);
      goto("/admin/rewards/gift-offers");
    } catch (err: unknown) {
      error = getErrorMessage(err);
      showDeleteDialog = false;
    } finally {
      deleting = false;
    }
  }

</script>

<div>
  <a href="/admin/rewards/gift-offers" class="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
    &larr; Back to Gift Offers
  </a>

  {#if loading}
    <LoadingSkeleton lines={10} />
  {:else if error}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
  {:else if offer}
    <!-- Header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        {#if editing}
          <h1 class="text-xl font-semibold text-gray-900">Editing: {offer.name}</h1>
        {:else}
          <h1 class="text-xl font-semibold text-gray-900">{offer.name}</h1>
        {/if}
        <p class="text-sm text-gray-500 mt-1">
          Created {formatDate(offer.createdAt)}
        </p>
      </div>
      <div class="flex items-center gap-2">
        {#if editing}
          <Button variant="ghost" size="sm" onclick={cancelEdit} disabled={saving}>Cancel</Button>
          <Button variant="primary" size="sm" onclick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        {:else}
          <Button variant="outline" size="sm" onclick={enterEditMode}>
            <Pencil class="w-4 h-4" /> Edit
          </Button>
          <Button variant="danger" size="sm" onclick={() => (showDeleteDialog = true)}>
            <Trash2 class="w-4 h-4" /> Delete
          </Button>
        {/if}
      </div>
    </div>

    {#if editError}
      <div class="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">{editError}</div>
    {/if}

    {#if editing}
      <!-- EDIT MODE -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <!-- Basic Info -->
          <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <h2 class="font-medium text-gray-900">Basic Info</h2>
            <Input name="editName" label="Name" bind:value={editName} required />
            <div class="space-y-1">
              <label for="editDescription" class="form-label">Description</label>
              <textarea
                id="editDescription"
                bind:value={editDescription}
                rows="3"
                placeholder="Gift offer description"
                class="form-input text-sm"
              ></textarea>
            </div>
            <div class="space-y-1">
              <label for="editTerms" class="form-label">Terms & Conditions</label>
              <textarea
                id="editTerms"
                bind:value={editTermsAndConditions}
                rows="3"
                placeholder="Terms and conditions"
                class="form-input text-sm"
              ></textarea>
            </div>
          </div>

          <!-- Image Upload -->
          <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <h2 class="font-medium text-gray-900">Image</h2>
            {#if offer.image}
              <div class="relative w-48 h-48 rounded-lg overflow-hidden bg-gray-100">
                <img src={offer.image} alt={offer.name} class="w-full h-full object-cover" />
              </div>
            {/if}
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                class="hidden"
                onchange={handleImageUpload}
                disabled={uploading}
              />
              <Button variant="outline" size="sm" type="button" disabled={uploading}>
                <Upload class="w-4 h-4" />
                {uploading ? "Uploading..." : offer.image ? "Replace Image" : "Upload Image"}
              </Button>
            </label>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <h2 class="font-medium text-gray-900">Status</h2>
            <Select name="editStatus" label="Status" bind:value={editStatus} options={statusOptions} />
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <h2 class="font-medium text-gray-900">Cost</h2>
            <Input name="editPoints" label="Points Cost" type="number" bind:value={editPoints} placeholder="0" />
            <Input name="editStamps" label="Stamps Cost" type="number" bind:value={editStamps} placeholder="0" />
            <div class="flex items-center gap-2">
              <input type="checkbox" id="editRedeemable" bind:checked={editIsRedeemable} class="rounded border-gray-300" />
              <label for="editRedeemable" class="text-sm text-gray-700">Redeemable by members</label>
            </div>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <h2 class="font-medium text-gray-900">Face Value</h2>
            <Input name="editFaceValue" label="Value" type="number" bind:value={editFaceValue} placeholder="0" />
            <Select name="editFaceValueType" label="Type" bind:value={editFaceValueType} options={faceValueTypeOptions} />
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <h2 class="font-medium text-gray-900">Quota</h2>
            <Input name="editQuota" label="Total Quota" type="number" bind:value={editQuota} placeholder="Unlimited" />
            <Input name="editQuotaPerMember" label="Per Member" type="number" bind:value={editQuotaPerMember} placeholder="Unlimited" />
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <h2 class="font-medium text-gray-900">Expiry</h2>
            <div class="grid grid-cols-2 gap-2">
              <Input name="editExpiryPeriod" label="Period" type="number" bind:value={editExpiryPeriod} placeholder="—" />
              <Select name="editExpiryUnit" label="Unit" bind:value={editExpiryPeriodUnit} options={expiryUnitOptions} />
            </div>
            <Input name="editStartDate" label="Start Date" type="date" bind:value={editStartDate} />
            <Input name="editEndDate" label="End Date" type="date" bind:value={editEndDate} />
          </div>
        </div>
      </div>
    {:else}
      <!-- VIEW MODE -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <!-- Image -->
          {#if offer.image}
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="font-medium text-gray-900 mb-3">Image</h2>
              <div class="w-48 h-48 rounded-lg overflow-hidden bg-gray-100">
                <img src={offer.image} alt={offer.name} class="w-full h-full object-cover" />
              </div>
            </div>
          {/if}

          <!-- Description -->
          {#if offer.description}
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="font-medium text-gray-900 mb-2">Description</h2>
              <p class="text-sm text-gray-700 whitespace-pre-wrap">{offer.description}</p>
            </div>
          {/if}

          <!-- Terms & Conditions -->
          {#if offer.termsAndConditions}
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="font-medium text-gray-900 mb-2">Terms & Conditions</h2>
              <p class="text-sm text-gray-700 whitespace-pre-wrap">{offer.termsAndConditions}</p>
            </div>
          {/if}
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <h2 class="font-medium text-gray-900">Status</h2>
              <StatusBadge status={offer.status} variant="giftOffer" />
            </div>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Points / Stamps Cost</h2>
            <dl class="text-sm space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-500">Points</dt>
                <dd class="font-medium text-gray-900">{offer.points}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Stamps</dt>
                <dd class="font-medium text-gray-900">{offer.stamps}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Redeemable</dt>
                <dd class="text-gray-700">{offer.isRedeemable ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Face Value</h2>
            <dl class="text-sm space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-500">Value</dt>
                <dd class="font-medium text-gray-900">{formatFaceValue(offer)}</dd>
              </div>
              {#if offer.faceValueType}
                <div class="flex justify-between">
                  <dt class="text-gray-500">Type</dt>
                  <dd class="text-gray-700">{offer.faceValueType === "PERCENTAGE" ? "Percentage" : "Fixed Amount"}</dd>
                </div>
              {/if}
            </dl>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Quota</h2>
            <dl class="text-sm space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-500">Total</dt>
                <dd class="text-gray-700">{offer.quota ?? "Unlimited"}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Per Member</dt>
                <dd class="text-gray-700">{offer.quotaPerMember ?? "Unlimited"}</dd>
              </div>
            </dl>
          </div>

          {#if offer.expiryPeriod != null || offer.startDate || offer.endDate}
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="font-medium text-gray-900 mb-2">Expiry</h2>
              <dl class="text-sm space-y-2">
                {#if offer.expiryPeriod != null}
                  <div class="flex justify-between">
                    <dt class="text-gray-500">Period</dt>
                    <dd class="text-gray-700">{offer.expiryPeriod} {offer.expiryPeriodUnit?.toLowerCase() ?? ""}</dd>
                  </div>
                {/if}
                {#if offer.startDate}
                  <div class="flex justify-between">
                    <dt class="text-gray-500">Start</dt>
                    <dd class="text-gray-700">{formatDate(offer.startDate)}</dd>
                  </div>
                {/if}
                {#if offer.endDate}
                  <div class="flex justify-between">
                    <dt class="text-gray-500">End</dt>
                    <dd class="text-gray-700">{formatDate(offer.endDate)}</dd>
                  </div>
                {/if}
              </dl>
            </div>
          {/if}

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Dates</h2>
            <dl class="text-sm space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-500">Created</dt>
                <dd class="text-gray-700">{formatDate(offer.createdAt)}</dd>
              </div>
              {#if offer.updatedAt}
                <div class="flex justify-between">
                  <dt class="text-gray-500">Updated</dt>
                  <dd class="text-gray-700">{formatDate(offer.updatedAt)}</dd>
                </div>
              {/if}
            </dl>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<ConfirmDialog
  bind:open={showDeleteDialog}
  title="Delete Gift Offer"
  message={offer ? `Are you sure you want to delete "${offer.name}"? This action cannot be undone.` : ""}
  confirmLabel="Delete"
  confirmVariant="danger"
  loading={deleting}
  onConfirm={handleDelete}
  onCancel={() => (showDeleteDialog = false)}
/>
