<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { adminProductsApi, adminCategoriesApi } from "$lib/api/admin";
  import type { ProductDetail, UpdateProductInput, Category } from "$lib/types/admin";
  import type { Translations } from "$lib/types/admin";
  import { formatCurrency, formatDate } from "$lib/utils/formatting";
  import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
  import ImageUpload from "$lib/components/admin/ImageUpload.svelte";
  import ProductOptionEditor from "$lib/components/admin/ProductOptionEditor.svelte";
  import ProductVariationEditor from "$lib/components/admin/ProductVariationEditor.svelte";
  import LoadingSkeleton from "$lib/components/ui/LoadingSkeleton.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Select from "$lib/components/ui/Select.svelte";
  import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
  import LocaleTabs from "$lib/components/admin/LocaleTabs.svelte";
  import { Pencil, Trash2 } from "lucide-svelte";

  let product = $state<ProductDetail | null>(null);
  let categories = $state<Category[]>([]);
  let loading = $state(true);
  let error = $state("");

  // Edit mode
  let editing = $state(false);
  let saving = $state(false);
  let editError = $state("");
  let editName = $state("");
  let editPrice = $state("");
  let editDiscountPrice = $state("");
  let editMemberPrice = $state("");
  let editSku = $state("");
  let editStatus = $state("");
  let editStockQuantity = $state("");
  let editStockStatus = $state("");
  let editTrackInventory = $state(true);
  let editCategoryId = $state("");
  let editProductType = $state("");
  let editDescription = $state("");
  let editTranslations = $state<Translations>({});

  // Delete
  let showDeleteDialog = $state(false);
  let deleting = $state(false);

  const statusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "ACTIVE", label: "Active" },
    { value: "ARCHIVED", label: "Archived" },
  ];

  const stockStatusOptions = [
    { value: "in_stock", label: "In Stock" },
    { value: "out_of_stock", label: "Out of Stock" },
    { value: "low_stock", label: "Low Stock" },
  ];

  const productTypeOptions = [
    { value: "one_time", label: "One-time" },
    { value: "subscription", label: "Subscription" },
  ];

  const categoryOptions = $derived([
    { value: "", label: "No category" },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ]);

  onMount(async () => {
    await Promise.all([loadProduct(), loadCategories()]);
  });

  async function loadProduct() {
    loading = true;
    try {
      product = await adminProductsApi.get($page.params.id!);
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to load product";
    } finally {
      loading = false;
    }
  }

  async function loadCategories() {
    try {
      categories = await adminCategoriesApi.list();
    } catch {
      // Non-critical
    }
  }

  function enterEditMode() {
    if (!product) return;
    editName = product.name;
    editPrice = product.price;
    editDiscountPrice = product.discountPrice ?? "";
    editMemberPrice = product.memberPrice ?? "";
    editSku = product.sku ?? "";
    editStatus = product.status;
    editStockQuantity = String(product.stockQuantity);
    editStockStatus = product.stockStatus;
    editTrackInventory = product.trackInventory;
    editCategoryId = product.categoryId ? String(product.categoryId) : "";
    editProductType = product.productType ?? "one_time";
    editDescription = product.description ?? "";
    editTranslations = product.translations ? { ...product.translations } : {};
    editError = "";
    editing = true;
  }

  function cancelEdit() {
    editing = false;
    editError = "";
  }

  async function handleSave() {
    if (!product) return;
    if (!editName.trim() || !editPrice.trim()) {
      editError = "Name and price are required.";
      return;
    }

    saving = true;
    editError = "";
    try {
      const input: UpdateProductInput = {
        name: editName.trim(),
        price: editPrice.trim(),
        status: editStatus as "DRAFT" | "ACTIVE" | "ARCHIVED",
        stockQuantity: parseInt(editStockQuantity, 10) || 0,
        sku: editSku.trim() || null,
        description: editDescription.trim() || null,
        discountPrice: editDiscountPrice.trim() || null,
        memberPrice: editMemberPrice.trim() || null,
        stockStatus: editStockStatus as "in_stock" | "out_of_stock" | "low_stock",
        trackInventory: editTrackInventory,
        categoryId: editCategoryId ? Number(editCategoryId) : null,
        productType: editProductType as "one_time" | "subscription",
        translations: editTranslations,
      };

      await adminProductsApi.update(product.id, input);
      editing = false;
      await loadProduct();
    } catch (err: unknown) {
      editError = err instanceof Error ? err.message : "Failed to update product";
    } finally {
      saving = false;
    }
  }

  async function handleDelete() {
    if (!product) return;
    deleting = true;
    try {
      await adminProductsApi.delete(product.id);
      goto("/admin/products");
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to delete product";
      showDeleteDialog = false;
    } finally {
      deleting = false;
    }
  }
</script>

<div>
  <a href="/admin/products" class="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
    &larr; Back to Products
  </a>

  {#if loading}
    <LoadingSkeleton lines={10} />
  {:else if error}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
  {:else if product}
    <!-- Header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        {#if editing}
          <h1 class="text-xl font-semibold text-gray-900">Editing: {product.name}</h1>
        {:else}
          <h1 class="text-xl font-semibold text-gray-900">{product.name}</h1>
        {/if}
        <p class="text-sm text-gray-500 mt-1">
          {#if product.sku}SKU: {product.sku} &middot; {/if}
          Created {formatDate(product.createdAt)}
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
            <Input name="editName" label="Name" bind:value={editName} required />
            <div class="space-y-1">
              <label for="editDescription" class="form-label">Description</label>
              <textarea
                id="editDescription"
                bind:value={editDescription}
                rows="5"
                placeholder="Product description"
                class="form-input text-sm"
              ></textarea>
            </div>
          </div>

          <!-- Translations -->
          <LocaleTabs
            translations={editTranslations}
            onchange={(t) => (editTranslations = t)}
            baseName={editName}
            baseDescription={editDescription}
          />

          <!-- Images (interactive) -->
          <ImageUpload productId={product.id} images={product.images} onChanged={loadProduct} />

          <!-- Options (interactive) -->
          <ProductOptionEditor productId={product.id} options={product.options} onChanged={loadProduct} />

          <!-- Variations (interactive) -->
          <ProductVariationEditor productId={product.id} variations={product.variations ?? []} options={product.options} onChanged={loadProduct} />
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <!-- Pricing -->
          <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <h2 class="font-medium text-gray-900">Pricing</h2>
            <Input name="editPrice" label="Price" bind:value={editPrice} required />
            <Input name="editDiscountPrice" label="Discount Price" bind:value={editDiscountPrice} placeholder="Optional" />
            <Input name="editMemberPrice" label="Member Price" bind:value={editMemberPrice} placeholder="Optional" />
          </div>

          <!-- Status & Organization -->
          <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <Select name="editStatus" label="Status" bind:value={editStatus} options={statusOptions} />
            <Select name="editProductType" label="Product Type" bind:value={editProductType} options={productTypeOptions} />
            <Select name="editCategoryId" label="Category" bind:value={editCategoryId} options={categoryOptions} />
          </div>

          <!-- Inventory -->
          <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <h2 class="font-medium text-gray-900">Inventory</h2>
            <Input name="editStockQuantity" label="Stock Quantity" type="number" bind:value={editStockQuantity} />
            <Select name="editStockStatus" label="Stock Status" bind:value={editStockStatus} options={stockStatusOptions} />
            <div class="flex items-center gap-2">
              <input type="checkbox" id="editTrackInv" bind:checked={editTrackInventory} class="rounded border-gray-300" />
              <label for="editTrackInv" class="text-sm text-gray-700">Track Inventory</label>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <!-- VIEW MODE -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-4">
          <!-- Images -->
          {#if product.images.length > 0}
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="font-medium text-gray-900 mb-3">Images</h2>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {#each product.images as image (image.id)}
                  <div class="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={image.src} alt={image.alt ?? product.name} class="w-full h-full object-cover" />
                    {#if image.isPrimary}
                      <span class="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">Primary</span>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Description -->
          {#if product.description}
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="font-medium text-gray-900 mb-2">Description</h2>
              <p class="text-sm text-gray-700 whitespace-pre-wrap">{product.description}</p>
            </div>
          {/if}

          <!-- Options -->
          {#if product.options.length > 0}
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="font-medium text-gray-900 mb-3">Options ({product.options.length})</h2>
              <div class="space-y-2">
                {#each product.options as option (option.id)}
                  <div class="text-sm">
                    <span class="font-medium text-gray-700">{option.name}:</span>
                    <span class="text-gray-500 ml-1">{option.values.map(v => v.value).join(", ")}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Variations -->
          {#if (product.variations ?? []).length > 0}
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="font-medium text-gray-900 mb-3">Variations ({product.variations.length})</h2>
              <div class="space-y-2">
                {#each product.variations as v (v.id)}
                  <div class="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 text-sm">
                    <span class="font-medium text-gray-700">
                      {v.name || (v.selectedOptions ? Object.values(v.selectedOptions).join(" / ") : `#${v.id}`)}
                    </span>
                    <span class="text-gray-900 font-semibold">{formatCurrency(parseFloat(v.price))}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center justify-between">
              <h2 class="font-medium text-gray-900">Status</h2>
              <StatusBadge status={product.status} variant="product" />
            </div>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Pricing</h2>
            <dl class="text-sm space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-500">Price</dt>
                <dd class="font-medium text-gray-900">{formatCurrency(parseFloat(product.price))}</dd>
              </div>
              {#if product.discountPrice}
                <div class="flex justify-between">
                  <dt class="text-gray-500">Discount Price</dt>
                  <dd class="text-green-600 font-medium">{formatCurrency(parseFloat(product.discountPrice))}</dd>
                </div>
              {/if}
              {#if product.memberPrice}
                <div class="flex justify-between">
                  <dt class="text-gray-500">Member Price</dt>
                  <dd class="text-blue-600 font-medium">{formatCurrency(parseFloat(product.memberPrice))}</dd>
                </div>
              {/if}
            </dl>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Inventory</h2>
            <dl class="text-sm space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-500">Stock</dt>
                <dd class:text-red-600={product.stockQuantity <= 0} class="font-medium">{product.stockQuantity}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Stock Status</dt>
                <dd class="text-gray-700">{product.stockStatus.replace(/_/g, " ")}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Track Inventory</dt>
                <dd class="text-gray-700">{product.trackInventory ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Organization</h2>
            <dl class="text-sm space-y-2">
              {#if product.categoryName}
                <div class="flex justify-between">
                  <dt class="text-gray-500">Category</dt>
                  <dd class="text-gray-700">{product.categoryName}</dd>
                </div>
              {/if}
              {#if product.productType}
                <div class="flex justify-between">
                  <dt class="text-gray-500">Type</dt>
                  <dd class="text-gray-700">{product.productType}</dd>
                </div>
              {/if}
              <div class="flex justify-between">
                <dt class="text-gray-500">Visibility</dt>
                <dd class="text-gray-700">{product.visibility}</dd>
              </div>
            </dl>
          </div>

          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 class="font-medium text-gray-900 mb-2">Dates</h2>
            <dl class="text-sm space-y-2">
              <div class="flex justify-between">
                <dt class="text-gray-500">Created</dt>
                <dd class="text-gray-700">{formatDate(product.createdAt)}</dd>
              </div>
              {#if product.updatedAt}
                <div class="flex justify-between">
                  <dt class="text-gray-500">Updated</dt>
                  <dd class="text-gray-700">{formatDate(product.updatedAt)}</dd>
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
  title="Delete Product"
  message={product ? `Are you sure you want to delete "${product.name}"? This action cannot be undone.` : ""}
  confirmLabel="Delete"
  confirmVariant="danger"
  loading={deleting}
  onConfirm={handleDelete}
  onCancel={() => (showDeleteDialog = false)}
/>
