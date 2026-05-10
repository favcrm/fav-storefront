<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { adminAutomaticRewardsApi } from "$lib/api/admin";
  import type { AutomaticRewardDetail, UpdateAutomaticRewardInput, AutomaticRewardStatus, AutomaticRewardTrigger, AutomaticRewardRepeat } from "$lib/types/admin";
  import { formatDate, getErrorMessage } from "$lib/utils/formatting";
  import { triggerLabels, triggerOptions, repeatOptions } from "$lib/utils/admin-helpers";

  import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
  import LoadingSkeleton from "$lib/components/ui/LoadingSkeleton.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Select from "$lib/components/ui/Select.svelte";
  import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
  import { Pencil, Trash2 } from "lucide-svelte";

  let reward = $state<AutomaticRewardDetail | null>(null);
  let loading = $state(true);
  let error = $state("");

  // Edit mode
  let editing = $state(false);
  let saving = $state(false);
  let editError = $state("");
  let editName = $state("");
  let editTrigger = $state("");
  let editStatus = $state("");
  let editRepeat = $state("");
  let editBonusPoints = $state("");
  let editBonusStamps = $state("");
  let editBonusPointMultiplier = $state("");
  let editBonusStampMultiplier = $state("");
  let editMinSpendAmount = $state("");
  let editMinSpendCount = $state("");
  let editMinMembershipAge = $state("");
  let editTotalReferralCount = $state("");
  let editTargetTierIds = $state("");
  let editBonusGiftOfferId = $state("");
  let editBonusGiftOfferQuantity = $state("");

  // Delete
  let showDeleteDialog = $state(false);
  let deleting = $state(false);

  const statusOptions = [
    { value: "ACTIVE", label: "Active" },
    { value: "EXECUTED", label: "Executed" },
    { value: "DISABLED", label: "Disabled" },
  ];

  onMount(() => {
    loadReward();
  });

  async function loadReward() {
    loading = true;
    error = "";
    try {
      reward = await adminAutomaticRewardsApi.get($page.params.id!);
    } catch (err: unknown) {
      error = getErrorMessage(err);
    } finally {
      loading = false;
    }
  }

  function enterEditMode() {
    if (!reward) return;
    editName = reward.name;
    editTrigger = reward.trigger;
    editStatus = reward.status;
    editRepeat = reward.repeat;
    editBonusPoints = String(reward.bonusPoints);
    editBonusStamps = String(reward.bonusStamps);
    editBonusPointMultiplier = String(reward.bonusPointMultiplier);
    editBonusStampMultiplier = String(reward.bonusStampMultiplier);
    editMinSpendAmount = reward.minimumSpendingAmount != null ? String(reward.minimumSpendingAmount) : "";
    editMinSpendCount = reward.minimumSpendingCount != null ? String(reward.minimumSpendingCount) : "";
    editMinMembershipAge = reward.minimumMembershipAge != null ? String(reward.minimumMembershipAge) : "";
    editTotalReferralCount = reward.totalReferralCount != null ? String(reward.totalReferralCount) : "";
    editTargetTierIds = reward.targetTierIds.length > 0 ? reward.targetTierIds.join(", ") : "";
    editBonusGiftOfferId = reward.bonusGiftOfferId ?? "";
    editBonusGiftOfferQuantity = reward.bonusGiftOfferQuantity != null ? String(reward.bonusGiftOfferQuantity) : "";
    editError = "";
    editing = true;
  }

  function cancelEdit() {
    editing = false;
    editError = "";
  }

  async function handleSave() {
    if (!reward) return;
    if (!editName.trim()) {
      editError = "Name is required";
      return;
    }

    saving = true;
    editError = "";
    try {
      const input: UpdateAutomaticRewardInput = {
        name: editName.trim(),
        trigger: editTrigger as AutomaticRewardTrigger,
        status: editStatus as AutomaticRewardStatus,
        repeat: editRepeat as AutomaticRewardRepeat,
        bonusPoints: parseInt(editBonusPoints, 10) || 0,
        bonusStamps: parseInt(editBonusStamps, 10) || 0,
        bonusPointMultiplier: parseFloat(editBonusPointMultiplier) || 0,
        bonusStampMultiplier: parseFloat(editBonusStampMultiplier) || 0,
        minimumSpendingAmount: editMinSpendAmount.trim() ? parseFloat(editMinSpendAmount) : null,
        minimumSpendingCount: editMinSpendCount.trim() ? parseInt(editMinSpendCount, 10) : null,
        minimumMembershipAge: editMinMembershipAge.trim() ? parseInt(editMinMembershipAge, 10) : null,
        totalReferralCount: editTotalReferralCount.trim() ? parseInt(editTotalReferralCount, 10) : null,
        targetTierIds: editTargetTierIds.trim()
          ? editTargetTierIds.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        bonusGiftOfferId: editBonusGiftOfferId.trim() || null,
        bonusGiftOfferQuantity: editBonusGiftOfferQuantity.trim() ? parseInt(editBonusGiftOfferQuantity, 10) : null,
      };

      await adminAutomaticRewardsApi.update(reward.id, input);
      editing = false;
      await loadReward();
    } catch (err: unknown) {
      editError = getErrorMessage(err);
    } finally {
      saving = false;
    }
  }

  async function handleDelete() {
    if (!reward) return;
    deleting = true;
    try {
      await adminAutomaticRewardsApi.delete(reward.id);
      goto("/admin/rewards/automatic-rewards");
    } catch (err: unknown) {
      error = getErrorMessage(err);
      showDeleteDialog = false;
    } finally {
      deleting = false;
    }
  }
</script>

<div>
  <a href="/admin/rewards/automatic-rewards" class="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
    &larr; Back to Automatic Rewards
  </a>

  {#if loading}
    <LoadingSkeleton lines={10} />
  {:else if error}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
  {:else if reward}
    <!-- Header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        {#if editing}
          <h1 class="text-xl font-semibold text-gray-900">Editing: {reward.name}</h1>
        {:else}
          <h1 class="text-xl font-semibold text-gray-900">{reward.name}</h1>
        {/if}
        <p class="text-sm text-gray-500 mt-1">
          Created {formatDate(reward.createdAt)}
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
            <Select name="editTrigger" label="Trigger" bind:value={editTrigger} options={triggerOptions} />
            <Select name="editRepeat" label="Repeat" bind:value={editRepeat} options={repeatOptions} />
          </div>

          <!-- Conditions -->
          <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <h2 class="font-medium text-gray-900">Conditions</h2>
            <div class="grid grid-cols-2 gap-4">
              <Input
                name="editMinSpendAmount"
                label="Min Spending Amount"
                type="number"
                bind:value={editMinSpendAmount}
                placeholder="No minimum"
              />
              <Input
                name="editMinSpendCount"
                label="Min Spending Count"
                type="number"
                bind:value={editMinSpendCount}
                placeholder="No minimum"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <Input
                name="editMinMembershipAge"
                label="Min Membership Age (days)"
                type="number"
                bind:value={editMinMembershipAge}
                placeholder="No minimum"
              />
              <Input
                name="editTotalReferralCount"
                label="Total Referral Count"
                type="number"
                bind:value={editTotalReferralCount}
                placeholder="No minimum"
              />
            </div>
            <Input
              name="editTargetTierIds"
              label="Target Tier IDs (comma-separated)"
              bind:value={editTargetTierIds}
              placeholder="e.g. tier-1, tier-2"
            />
          </div>

          <!-- Bonus Gift Offer -->
          <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <h2 class="font-medium text-gray-900">Bonus Gift Offer</h2>
            <Input
              name="editBonusGiftOfferId"
              label="Gift Offer ID"
              bind:value={editBonusGiftOfferId}
              placeholder="Optional gift offer ID"
            />
            <Input
              name="editBonusGiftOfferQuantity"
              label="Gift Offer Quantity"
              type="number"
              bind:value={editBonusGiftOfferQuantity}
              placeholder="1"
            />
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <h2 class="font-medium text-gray-900">Status</h2>
            <Select name="editStatus" label="Status" bind:value={editStatus} options={statusOptions} />
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <h2 class="font-medium text-gray-900">Bonus Rewards</h2>
            <Input
              name="editBonusPoints"
              label="Bonus Points"
              type="number"
              bind:value={editBonusPoints}
              placeholder="0"
            />
            <Input
              name="editBonusStamps"
              label="Bonus Stamps"
              type="number"
              bind:value={editBonusStamps}
              placeholder="0"
            />
            <Input
              name="editBonusPointMultiplier"
              label="Point Multiplier"
              type="number"
              bind:value={editBonusPointMultiplier}
              placeholder="1"
            />
            <Input
              name="editBonusStampMultiplier"
              label="Stamp Multiplier"
              type="number"
              bind:value={editBonusStampMultiplier}
              placeholder="1"
            />
          </div>
        </div>
      </div>
    {:else}
      <!-- VIEW MODE -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <!-- Trigger Info -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-3">Trigger</h2>
            <dl class="text-sm space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-500">Trigger Event</dt>
                <dd class="font-medium text-gray-900">{triggerLabels[reward.trigger] ?? reward.trigger}</dd>
              </div>
              {#if reward.targetTierIds.length > 0}
                <div class="flex justify-between">
                  <dt class="text-gray-500">Target Tiers</dt>
                  <dd class="text-gray-700">{reward.targetTierIds.join(", ")}</dd>
                </div>
              {/if}
            </dl>
          </div>

          <!-- Conditions -->
          {#if reward.minimumSpendingAmount != null || reward.minimumSpendingCount != null || reward.minimumMembershipAge != null || reward.totalReferralCount != null}
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="font-medium text-gray-900 mb-3">Conditions</h2>
              <dl class="text-sm space-y-2">
                {#if reward.minimumSpendingAmount != null}
                  <div class="flex justify-between">
                    <dt class="text-gray-500">Min Spending Amount</dt>
                    <dd class="text-gray-700">{reward.minimumSpendingAmount}</dd>
                  </div>
                {/if}
                {#if reward.minimumSpendingCount != null}
                  <div class="flex justify-between">
                    <dt class="text-gray-500">Min Spending Count</dt>
                    <dd class="text-gray-700">{reward.minimumSpendingCount}</dd>
                  </div>
                {/if}
                {#if reward.minimumMembershipAge != null}
                  <div class="flex justify-between">
                    <dt class="text-gray-500">Min Membership Age</dt>
                    <dd class="text-gray-700">{reward.minimumMembershipAge} days</dd>
                  </div>
                {/if}
                {#if reward.totalReferralCount != null}
                  <div class="flex justify-between">
                    <dt class="text-gray-500">Total Referral Count</dt>
                    <dd class="text-gray-700">{reward.totalReferralCount}</dd>
                  </div>
                {/if}
              </dl>
            </div>
          {/if}

          <!-- Bonus Gift Offer -->
          {#if reward.bonusGiftOfferId}
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="font-medium text-gray-900 mb-3">Bonus Gift Offer</h2>
              <dl class="text-sm space-y-2">
                <div class="flex justify-between">
                  <dt class="text-gray-500">Gift Offer ID</dt>
                  <dd class="text-gray-700 font-mono text-xs">{reward.bonusGiftOfferId}</dd>
                </div>
                {#if reward.bonusGiftOfferQuantity != null}
                  <div class="flex justify-between">
                    <dt class="text-gray-500">Quantity</dt>
                    <dd class="text-gray-700">{reward.bonusGiftOfferQuantity}</dd>
                  </div>
                {/if}
              </dl>
            </div>
          {/if}
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <h2 class="font-medium text-gray-900">Status</h2>
              <StatusBadge status={reward.status} variant="automaticReward" />
            </div>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Trigger</h2>
            <dl class="text-sm space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-500">Event</dt>
                <dd class="text-gray-700">{triggerLabels[reward.trigger] ?? reward.trigger}</dd>
              </div>
            </dl>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Repeat</h2>
            <dl class="text-sm space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-500">Frequency</dt>
                <dd class="text-gray-700">
                  {reward.repeat === "NONE" ? "One-time" : reward.repeat.charAt(0) + reward.repeat.slice(1).toLowerCase()}
                </dd>
              </div>
            </dl>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Bonus Rewards</h2>
            <dl class="text-sm space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-500">Points</dt>
                <dd class="font-medium text-gray-900">{reward.bonusPoints}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Stamps</dt>
                <dd class="font-medium text-gray-900">{reward.bonusStamps}</dd>
              </div>
              {#if reward.bonusPointMultiplier !== 0 && reward.bonusPointMultiplier !== 1}
                <div class="flex justify-between">
                  <dt class="text-gray-500">Point Multiplier</dt>
                  <dd class="text-gray-700">{reward.bonusPointMultiplier}x</dd>
                </div>
              {/if}
              {#if reward.bonusStampMultiplier !== 0 && reward.bonusStampMultiplier !== 1}
                <div class="flex justify-between">
                  <dt class="text-gray-500">Stamp Multiplier</dt>
                  <dd class="text-gray-700">{reward.bonusStampMultiplier}x</dd>
                </div>
              {/if}
            </dl>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Dates</h2>
            <dl class="text-sm space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-500">Created</dt>
                <dd class="text-gray-700">{formatDate(reward.createdAt)}</dd>
              </div>
              {#if reward.updatedAt}
                <div class="flex justify-between">
                  <dt class="text-gray-500">Updated</dt>
                  <dd class="text-gray-700">{formatDate(reward.updatedAt)}</dd>
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
  title="Delete Automatic Reward"
  message={reward ? `Are you sure you want to delete "${reward.name}"? This action cannot be undone.` : ""}
  confirmLabel="Delete"
  confirmVariant="danger"
  loading={deleting}
  onConfirm={handleDelete}
  onCancel={() => (showDeleteDialog = false)}
/>
