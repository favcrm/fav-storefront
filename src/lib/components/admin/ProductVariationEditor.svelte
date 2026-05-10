<script lang="ts">
  import { adminProductsApi } from "$lib/api/admin";
  import type {
    ProductVariationAdmin,
    ProductOption,
  } from "$lib/types/admin";
  import { formatCurrency } from "$lib/utils/formatting";
  import Input from "$lib/components/ui/Input.svelte";
  import Select from "$lib/components/ui/Select.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
  import { Plus, Pencil, Trash2 } from "lucide-svelte";

  interface Props {
    productId: number;
    variations: ProductVariationAdmin[];
    options: ProductOption[];
    onChanged: () => void;
  }

  let { productId, variations, options, onChanged }: Props = $props();

  const stockStatusOptions = [
    { value: "in_stock", label: "In Stock" },
    { value: "out_of_stock", label: "Out of Stock" },
    { value: "low_stock", label: "Low Stock" },
  ];

  // Form state
  let showForm = $state(false);
  let editingVariation = $state<ProductVariationAdmin | null>(null);
  let formPrice = $state("");
  let formDiscountPrice = $state("");
  let formMemberPrice = $state("");
  let formSku = $state("");
  let formStockQuantity = $state("0");
  let formStockStatus = $state("in_stock");
  let formSelectedOptions = $state<Record<string, string>>({});
  let saving = $state(false);
  let formError = $state("");

  // Delete state
  let deleteOpen = $state(false);
  let deleteLoading = $state(false);
  let deleteTarget = $state<ProductVariationAdmin | null>(null);

  // Build display name from selected options
  function variationLabel(v: ProductVariationAdmin): string {
    if (v.name) return v.name;
    if (v.selectedOptions && Object.keys(v.selectedOptions).length > 0) {
      return Object.values(v.selectedOptions).join(" / ");
    }
    return `Variation #${v.id}`;
  }

  function openCreate() {
    editingVariation = null;
    formPrice = "";
    formDiscountPrice = "";
    formMemberPrice = "";
    formSku = "";
    formStockQuantity = "0";
    formStockStatus = "in_stock";
    // Pre-fill first value from each option
    const initial: Record<string, string> = {};
    for (const opt of options) {
      if (opt.values.length > 0) {
        initial[opt.name] = opt.values[0].value;
      }
    }
    formSelectedOptions = initial;
    formError = "";
    showForm = true;
  }

  function openEdit(v: ProductVariationAdmin) {
    editingVariation = v;
    formPrice = v.price;
    formDiscountPrice = v.discountPrice ?? "";
    formMemberPrice = v.memberPrice ?? "";
    formSku = v.sku ?? "";
    formStockQuantity = String(v.stockQuantity);
    formStockStatus = v.stockStatus;
    formSelectedOptions = v.selectedOptions ? { ...v.selectedOptions } : {};
    formError = "";
    showForm = true;
  }

  function cancelForm() {
    showForm = false;
    editingVariation = null;
  }

  async function handleSave() {
    if (!formPrice.trim()) {
      formError = "Price is required";
      return;
    }

    saving = true;
    formError = "";

    const name = Object.keys(formSelectedOptions).length > 0
      ? Object.values(formSelectedOptions).join(" / ")
      : null;

    try {
      if (editingVariation) {
        await adminProductsApi.updateVariation(productId, editingVariation.id, {
          name: name ?? undefined,
          price: formPrice.trim(),
          discountPrice: formDiscountPrice.trim() || null,
          memberPrice: formMemberPrice.trim() || null,
          sku: formSku.trim() || undefined,
          stockQuantity: parseInt(formStockQuantity, 10) || 0,
          stockStatus: formStockStatus,
          selectedOptions: formSelectedOptions,
        });
      } else {
        await adminProductsApi.createVariation(productId, {
          name: name ?? undefined,
          price: formPrice.trim(),
          discountPrice: formDiscountPrice.trim() || null,
          memberPrice: formMemberPrice.trim() || null,
          sku: formSku.trim() || undefined,
          stockQuantity: parseInt(formStockQuantity, 10) || 0,
          stockStatus: formStockStatus,
          selectedOptions: formSelectedOptions,
        });
      }
      showForm = false;
      editingVariation = null;
      onChanged();
    } catch (err: unknown) {
      formError = err instanceof Error ? err.message : "Failed to save variation";
    } finally {
      saving = false;
    }
  }

  function openDelete(v: ProductVariationAdmin) {
    deleteTarget = v;
    deleteOpen = true;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    deleteLoading = true;
    try {
      await adminProductsApi.deleteVariation(productId, deleteTarget.id);
      deleteOpen = false;
      deleteTarget = null;
      onChanged();
    } catch {
      formError = "Failed to delete variation";
      deleteOpen = false;
    } finally {
      deleteLoading = false;
    }
  }
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4">
  <div class="flex items-center justify-between mb-3">
    <h2 class="font-medium text-gray-900">Variations ({variations.length})</h2>
    {#if !showForm}
      <button
        type="button"
        onclick={openCreate}
        class="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
      >
        <Plus class="w-3.5 h-3.5" />
        Add Variation
      </button>
    {/if}
  </div>

  {#if formError && !showForm}
    <div class="p-2 bg-red-50 text-red-700 rounded text-xs mb-3">{formError}</div>
  {/if}

  <!-- Existing variations -->
  {#if variations.length > 0 && !showForm}
    <div class="space-y-2">
      {#each variations as v (v.id)}
        <div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-900 truncate">{variationLabel(v)}</span>
              <span class="text-sm text-gray-900 font-semibold shrink-0">
                {formatCurrency(parseFloat(v.price))}
              </span>
            </div>
            <div class="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
              {#if v.sku}
                <span>SKU: {v.sku}</span>
              {/if}
              <span>Stock: {v.stockQuantity}</span>
              <span class="capitalize">{v.stockStatus.replace(/_/g, " ")}</span>
              {#if v.discountPrice}
                <span class="text-green-600">Sale: {formatCurrency(parseFloat(v.discountPrice))}</span>
              {/if}
              {#if v.memberPrice}
                <span class="text-blue-600">Member: {formatCurrency(parseFloat(v.memberPrice))}</span>
              {/if}
            </div>
          </div>
          <div class="flex items-center gap-1 ml-3 shrink-0">
            <button
              onclick={() => openEdit(v)}
              class="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
              title="Edit"
            >
              <Pencil class="w-3.5 h-3.5" />
            </button>
            <button
              onclick={() => openDelete(v)}
              class="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
              title="Delete"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Inline form -->
  {#if showForm}
    <div class="border border-gray-200 rounded-lg p-3 space-y-3 mt-2">
      {#if formError}
        <div class="p-2 bg-red-50 text-red-700 rounded text-xs">{formError}</div>
      {/if}

      <!-- Option selectors (only if product has options defined) -->
      {#if options.length > 0}
        <div class="space-y-2">
          {#each options as opt (opt.id)}
            {@const optionValues = [
              ...opt.values.map((v) => ({ value: v.value, label: v.value })),
            ]}
            <Select
              name={`opt-${opt.id}`}
              label={opt.name}
              bind:value={formSelectedOptions[opt.name]}
              options={optionValues}
            />
          {/each}
        </div>
      {/if}

      <!-- Pricing row -->
      <div class="grid grid-cols-3 gap-2">
        <Input name="varPrice" label="Price" bind:value={formPrice} required placeholder="138" />
        <Input name="varDiscount" label="Sale Price" bind:value={formDiscountPrice} placeholder="Optional" />
        <Input name="varMember" label="Member Price" bind:value={formMemberPrice} placeholder="Optional" />
      </div>

      <!-- Inventory row -->
      <div class="grid grid-cols-3 gap-2">
        <Input name="varSku" label="SKU" bind:value={formSku} placeholder="Optional" />
        <Input name="varStock" label="Stock Qty" type="number" bind:value={formStockQuantity} />
        <Select name="varStockStatus" label="Stock Status" bind:value={formStockStatus} options={stockStatusOptions} />
      </div>

      <div class="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onclick={cancelForm} disabled={saving}>
          Cancel
        </Button>
        <Button size="sm" onclick={handleSave} disabled={saving}>
          {saving ? "Saving..." : editingVariation ? "Save" : "Add"}
        </Button>
      </div>
    </div>
  {/if}

  {#if variations.length === 0 && !showForm}
    <p class="text-sm text-gray-400 text-center py-4">
      {#if options.length === 0}
        Add options first (e.g. Size), then create variations with pricing for each.
      {:else}
        No variations yet. Add one for each option combination.
      {/if}
    </p>
  {/if}
</div>

<ConfirmDialog
  bind:open={deleteOpen}
  title="Delete Variation"
  message={deleteTarget ? `Delete variation "${variationLabel(deleteTarget)}"?` : ""}
  confirmLabel="Delete"
  confirmVariant="danger"
  loading={deleteLoading}
  onConfirm={handleDelete}
  onCancel={() => { deleteOpen = false; deleteTarget = null; }}
/>
