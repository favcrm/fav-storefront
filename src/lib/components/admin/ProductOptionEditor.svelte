<script lang="ts">
  import { adminProductsApi } from "$lib/api/admin";
  import type { ProductOption } from "$lib/types/admin";
  import Input from "$lib/components/ui/Input.svelte";
  import TagInput from "$lib/components/ui/TagInput.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";
  import { Plus, Pencil, Trash2 } from "lucide-svelte";

  interface Props {
    productId: number;
    options: ProductOption[];
    onChanged: () => void;
  }

  let { productId, options, onChanged }: Props = $props();

  // Form state
  let showForm = $state(false);
  let editingOption = $state<ProductOption | null>(null);
  let formName = $state("");
  let formRequired = $state(false);
  let formValues = $state<string[]>([]);
  let saving = $state(false);
  let formError = $state("");

  // Delete state
  let deleteOpen = $state(false);
  let deleteLoading = $state(false);
  let deleteTarget = $state<ProductOption | null>(null);

  function openCreate() {
    editingOption = null;
    formName = "";
    formRequired = false;
    formValues = [];
    formError = "";
    showForm = true;
  }

  function openEdit(option: ProductOption) {
    editingOption = option;
    formName = option.name;
    formRequired = option.required;
    formValues = option.values.map((v) => v.value);
    formError = "";
    showForm = true;
  }

  function cancelForm() {
    showForm = false;
    editingOption = null;
  }

  async function handleSave() {
    if (!formName.trim()) {
      formError = "Option name is required";
      return;
    }
    if (formValues.length === 0) {
      formError = "At least one value is required";
      return;
    }

    saving = true;
    formError = "";
    try {
      if (editingOption) {
        await adminProductsApi.updateOption(productId, editingOption.id, {
          name: formName.trim(),
          required: formRequired,
          values: formValues,
        });
      } else {
        await adminProductsApi.createOption(productId, {
          name: formName.trim(),
          required: formRequired,
          values: formValues,
        });
      }
      showForm = false;
      editingOption = null;
      onChanged();
    } catch (err: unknown) {
      formError = err instanceof Error ? err.message : "Failed to save option";
    } finally {
      saving = false;
    }
  }

  function openDelete(option: ProductOption) {
    deleteTarget = option;
    deleteOpen = true;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    deleteLoading = true;
    try {
      await adminProductsApi.deleteOption(productId, deleteTarget.id);
      deleteOpen = false;
      deleteTarget = null;
      onChanged();
    } catch {
      formError = "Failed to delete option";
      deleteOpen = false;
    } finally {
      deleteLoading = false;
    }
  }
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4">
  <div class="flex items-center justify-between mb-3">
    <h2 class="font-medium text-gray-900">Options ({options.length})</h2>
    {#if !showForm}
      <button
        type="button"
        onclick={openCreate}
        class="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
      >
        <Plus class="w-3.5 h-3.5" />
        Add Option
      </button>
    {/if}
  </div>

  {#if formError && !showForm}
    <div class="p-2 bg-red-50 text-red-700 rounded text-xs mb-3">{formError}</div>
  {/if}

  <!-- Existing options -->
  {#if options.length > 0 && !showForm}
    <div class="space-y-2">
      {#each options as option (option.id)}
        <div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-900">{option.name}</span>
              {#if option.required}
                <Badge variant="warning">Required</Badge>
              {/if}
            </div>
            <div class="flex flex-wrap gap-1 mt-1">
              {#each option.values as val (val.id)}
                <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {val.value}
                </span>
              {/each}
            </div>
          </div>
          <div class="flex items-center gap-1 ml-3 shrink-0">
            <button
              onclick={() => openEdit(option)}
              class="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
              title="Edit"
            >
              <Pencil class="w-3.5 h-3.5" />
            </button>
            <button
              onclick={() => openDelete(option)}
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

      <Input
        name="optionName"
        label="Option Name"
        bind:value={formName}
        placeholder="e.g. Size, Color, Scent"
        required
      />

      <TagInput
        name="optionValues"
        label="Values"
        bind:values={formValues}
        placeholder="Type a value and press Enter..."
      />

      <div class="flex items-center gap-2">
        <input type="checkbox" id="optRequired" bind:checked={formRequired} class="rounded border-gray-300" />
        <label for="optRequired" class="text-sm text-gray-700">Required</label>
      </div>

      <div class="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onclick={cancelForm} disabled={saving}>
          Cancel
        </Button>
        <Button size="sm" onclick={handleSave} disabled={saving}>
          {saving ? "Saving..." : editingOption ? "Save" : "Add"}
        </Button>
      </div>
    </div>
  {/if}

  {#if options.length === 0 && !showForm}
    <p class="text-sm text-gray-400 text-center py-4">No options yet</p>
  {/if}
</div>

<ConfirmDialog
  bind:open={deleteOpen}
  title="Delete Option"
  message={deleteTarget ? `Delete option "${deleteTarget.name}" and all its values?` : ""}
  confirmLabel="Delete"
  confirmVariant="danger"
  loading={deleteLoading}
  onConfirm={handleDelete}
  onCancel={() => { deleteOpen = false; deleteTarget = null; }}
/>
