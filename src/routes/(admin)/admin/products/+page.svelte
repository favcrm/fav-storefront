<script lang="ts">
  import { untrack } from "svelte";
  import { adminProductsApi } from "$lib/api/admin";
  import type { Product, AdminPaginatedResponse, CreateProductInput } from "$lib/types/admin";
  import { formatCurrency, formatDate } from "$lib/utils/formatting";

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
  import { Pencil, Trash2, Plus, Package } from "lucide-svelte";

  let search = $state("");
  let page = $state(1);
  let loading = $state(true);
  let data = $state<AdminPaginatedResponse<Product> | null>(null);
  let error = $state("");

  // Create modal state
  let showCreateModal = $state(false);
  let creating = $state(false);
  let createError = $state("");
  let createName = $state("");
  let createPrice = $state("");
  let createSku = $state("");
  let createStatus = $state("DRAFT");
  let createStockQuantity = $state("");
  let createDescription = $state("");

  // Delete dialog state
  let showDeleteDialog = $state(false);
  let deleting = $state(false);
  let deleteTarget = $state<Product | null>(null);

  const statusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "ACTIVE", label: "Active" },
    { value: "ARCHIVED", label: "Archived" },
  ];

  async function loadProducts() {
    loading = true;
    error = "";
    try {
      data = await adminProductsApi.list({
        page,
        pageSize: 20,
        search: search || undefined,
        ordering: "-createdAt",
      });
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to load products";
    } finally {
      loading = false;
    }
  }

  // Reset to page 1 when search changes
  $effect(() => {
    search;
    page = 1;
  });

  $effect(() => {
    search;
    page;
    untrack(() => { loadProducts(); });
  });

  function resetCreateForm() {
    createName = "";
    createPrice = "";
    createSku = "";
    createStatus = "DRAFT";
    createStockQuantity = "";
    createDescription = "";
    createError = "";
  }

  function openCreateModal() {
    resetCreateForm();
    showCreateModal = true;
  }

  async function handleCreate() {
    if (!createName.trim() || !createPrice.trim()) {
      createError = "Name and price are required.";
      return;
    }

    const priceNum = parseFloat(createPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      createError = "Please enter a valid price.";
      return;
    }

    creating = true;
    createError = "";
    try {
      const input: CreateProductInput = {
        name: createName.trim(),
        price: createPrice.trim(),
        status: createStatus as "DRAFT" | "ACTIVE" | "ARCHIVED",
      };
      if (createSku.trim()) input.sku = createSku.trim();
      if (createStockQuantity.trim()) {
        const qty = parseInt(createStockQuantity, 10);
        if (!isNaN(qty)) input.stockQuantity = qty;
      }
      if (createDescription.trim()) input.description = createDescription.trim();

      await adminProductsApi.create(input);
      showCreateModal = false;
      loadProducts();
    } catch (err: unknown) {
      createError = err instanceof Error ? err.message : "Failed to create product";
    } finally {
      creating = false;
    }
  }

  function confirmDelete(product: Product) {
    deleteTarget = product;
    showDeleteDialog = true;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    deleting = true;
    try {
      await adminProductsApi.delete(deleteTarget.id);
      showDeleteDialog = false;
      deleteTarget = null;
      loadProducts();
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to delete product";
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
      <h1 class="text-xl font-semibold text-gray-900">Products</h1>
      {#if data}
        <span class="text-sm text-gray-500">{data.total} total</span>
      {/if}
    </div>
    <Button variant="primary" size="sm" onclick={openCreateModal}>
      <Plus class="w-4 h-4" />
      New Product
    </Button>
  </div>

  <div class="mb-4">
    <SearchInput
      bind:value={search}
      placeholder="Search products..."
      class="max-w-md"
    />
  </div>

  {#if loading && !data}
    <LoadingSkeleton lines={8} />
  {:else if error}
    <div class="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
  {:else if data && data.items.length === 0}
    <EmptyState title="No products found" message={search ? "Try adjusting your search terms" : "Add your first product to start selling"}>
      {#snippet icon()}<Package class="w-6 h-6" />{/snippet}
      {#snippet actions()}
        {#if !search}
          <Button size="sm" onclick={openCreateModal}><Plus class="w-4 h-4" /> New Product</Button>
        {/if}
      {/snippet}
    </EmptyState>
  {:else if data}
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="text-left px-4 py-3 font-medium text-gray-600">Product</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Price</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.items as product (product.id)}
              <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3">
                  <a href="/admin/products/{product.id}" class="flex items-center gap-3">
                    {#if product.imageUrl}
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        class="w-10 h-10 object-cover rounded-md bg-gray-100"
                      />
                    {:else}
                      <div class="w-10 h-10 bg-gray-100 rounded-md"></div>
                    {/if}
                    <div>
                      <p class="font-medium text-gray-900">{product.name}</p>
                      {#if product.categoryName}
                        <p class="text-xs text-gray-500">{product.categoryName}</p>
                      {/if}
                    </div>
                  </a>
                </td>
                <td class="px-4 py-3 text-gray-500 font-mono text-xs">{product.sku ?? "—"}</td>
                <td class="px-4 py-3 text-right font-medium text-gray-900">
                  {formatCurrency(parseFloat(product.price))}
                  {#if product.discountPrice}
                    <span class="text-xs text-gray-400 line-through ml-1">
                      {formatCurrency(parseFloat(product.discountPrice))}
                    </span>
                  {/if}
                </td>
                <td class="px-4 py-3 text-right">
                  <span class:text-red-600={product.stockQuantity <= 0} class:text-gray-700={product.stockQuantity > 0}>
                    {product.stockQuantity}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <StatusBadge status={product.status} variant="product" />
                </td>
                <td class="px-4 py-3 text-gray-500">{formatDate(product.createdAt)}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <a
                      href="/admin/products/{product.id}"
                      class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Pencil class="w-4 h-4" />
                    </a>
                    <button
                      onclick={() => confirmDelete(product)}
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

<!-- Create Product Modal -->
<Modal bind:open={showCreateModal} title="New Product">
  <form novalidate onsubmit={(e) => { e.preventDefault(); handleCreate(); }} class="space-y-4">
    {#if createError}
      <div class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{createError}</div>
    {/if}

    <Input
      name="name"
      label="Name"
      bind:value={createName}
      placeholder="Product name"
      required
    />

    <Input
      name="price"
      label="Price"
      type="number"
      bind:value={createPrice}
      placeholder="0.00"
      required
    />

    <Input
      name="sku"
      label="SKU"
      bind:value={createSku}
      placeholder="Optional SKU"
    />

    <Select
      name="status"
      label="Status"
      bind:value={createStatus}
      options={statusOptions}
    />

    <Input
      name="stockQuantity"
      label="Stock Quantity"
      type="number"
      bind:value={createStockQuantity}
      placeholder="0"
    />

    <div class="space-y-1">
      <label for="description" class="form-label">Description</label>
      <textarea
        id="description"
        name="description"
        bind:value={createDescription}
        placeholder="Product description"
        rows="3"
        class="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:ring-0 focus:bg-white focus:border-green-700 text-slate-900 font-medium transition-colors rounded-none"
      ></textarea>
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button variant="ghost" type="button" onclick={() => (showCreateModal = false)} disabled={creating}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" disabled={creating}>
        {creating ? "Creating..." : "Create Product"}
      </Button>
    </div>
  </form>
</Modal>

<!-- Delete Confirmation -->
<ConfirmDialog
  bind:open={showDeleteDialog}
  title="Delete Product"
  message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.` : ""}
  confirmLabel="Delete"
  confirmVariant="danger"
  loading={deleting}
  onConfirm={handleDelete}
  onCancel={cancelDelete}
/>
