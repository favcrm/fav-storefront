<script lang="ts">
  import { onMount } from 'svelte';
  import { adminShippingMethodsApi } from '$lib/api/admin';
  import type { ShippingMethod, CreateShippingMethodInput } from '$lib/types/admin';
  import { Truck, Loader2, Plus, Edit2, Trash2, CheckCircle2, Circle } from 'lucide-svelte';

  let methods = $state<ShippingMethod[]>([]);
  let loading = $state(true);
  let error = $state('');

  // Editor modal state
  let isEditing = $state(false);
  let editId = $state<number | null>(null);
  let saving = $state(false);
  
  // Form fields
  let name = $state('');
  let description = $state('');
  let price = $state(0);
  let freeShippingThreshold = $state<number | null>(null);
  let estimatedDays = $state('');
  let isActive = $state(true);

  onMount(async () => {
    await loadMethods();
  });

  async function loadMethods() {
    loading = true;
    try {
      methods = await adminShippingMethodsApi.list();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load shipping methods';
    } finally {
      loading = false;
    }
  }

  function openCreate() {
    editId = null;
    name = '';
    description = '';
    price = 0;
    freeShippingThreshold = null;
    estimatedDays = '';
    isActive = true;
    isEditing = true;
  }

  function openEdit(method: ShippingMethod) {
    editId = method.id;
    name = method.name;
    description = method.description ?? '';
    price = method.price;
    freeShippingThreshold = method.freeShippingThreshold;
    estimatedDays = method.estimatedDays ?? '';
    isActive = method.isActive;
    isEditing = true;
  }

  function closeEdit() {
    isEditing = false;
    editId = null;
  }

  async function save() {
    if (!name.trim()) return;
    saving = true;
    error = '';
    
    const payload: CreateShippingMethodInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: Number(price),
      freeShippingThreshold: freeShippingThreshold ? Number(freeShippingThreshold) : null,
      estimatedDays: estimatedDays.trim() || null,
      isActive,
    };

    try {
      if (editId) {
        await adminShippingMethodsApi.update(editId, payload);
      } else {
        await adminShippingMethodsApi.create(payload);
      }
      await loadMethods();
      closeEdit();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save shipping method';
    } finally {
      saving = false;
    }
  }

  async function remove(id: number) {
    if (!confirm('Are you sure you want to delete this shipping method?')) return;
    try {
      await adminShippingMethodsApi.delete(id);
      await loadMethods();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete';
    }
  }
</script>

<div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
  <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
    <div class="flex items-center gap-2">
      <Truck class="w-4 h-4 text-gray-500" />
      <h2 class="text-sm font-semibold text-gray-700">Shipping Methods</h2>
    </div>
    <button 
      onclick={openCreate}
      class="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
    >
      <Plus class="w-3.5 h-3.5" />
      Add Method
    </button>
  </div>

  {#if loading}
    <div class="p-8 flex justify-center text-gray-400">
      <Loader2 class="w-5 h-5 animate-spin" />
    </div>
  {:else if methods.length === 0}
    <div class="p-8 text-center">
      <p class="text-sm text-gray-500">No shipping methods configured.</p>
    </div>
  {:else}
    <div class="divide-y divide-gray-100">
      {#each methods as method (method.id)}
        <div class="p-4 px-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-medium text-gray-900">{method.name}</span>
              {#if method.isActive}
                <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  <CheckCircle2 class="w-3 h-3" /> Active
                </span>
              {:else}
                <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-md">
                  <Circle class="w-3 h-3" /> Inactive
                </span>
              {/if}
            </div>
            <p class="text-xs text-gray-500 font-mono">
              ${(method.price / 100).toFixed(2)}
              {#if method.freeShippingThreshold}
                <span class="ml-2 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Free over ${(method.freeShippingThreshold / 100).toFixed(2)}</span>
              {/if}
            </p>
          </div>
          <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onclick={() => openEdit(method)}
              class="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
              title="Edit"
            >
              <Edit2 class="w-4 h-4" />
            </button>
            <button 
              onclick={() => remove(method.id)}
              class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if isEditing}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900">{editId ? 'Edit Shipping Method' : 'Add Shipping Method'}</h3>
      </div>
      
      <div class="p-6 space-y-4">
        <div>
          <label for="name" class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Name</label>
          <input 
            id="name" 
            type="text" 
            bind:value={name} 
            placeholder="e.g. Standard Delivery"
            class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-400"
          />
        </div>
        
        <div>
          <label for="description" class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Description</label>
          <textarea 
            id="description" 
            bind:value={description}
            rows="2"
            placeholder="e.g. 3-5 business days"
            class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-400 resize-y"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="price" class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Price (Cents)</label>
            <input 
              id="price" 
              type="number" 
              min="0"
              bind:value={price} 
              class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-400"
            />
          </div>
          <div>
            <label for="estimatedDays" class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Estimated Days</label>
            <input 
              id="estimatedDays" 
              type="text" 
              bind:value={estimatedDays} 
              placeholder="e.g. 3-5 days"
              class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-400"
            />
          </div>
        </div>

        <div>
          <label for="freeShippingThreshold" class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Free Shipping Threshold (Cents, Optional)</label>
          <input 
            id="freeShippingThreshold" 
            type="number" 
            min="0"
            bind:value={freeShippingThreshold} 
            placeholder="e.g. 5000 for $50.00"
            class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/20 focus:border-slate-400"
          />
        </div>

        <label class="flex items-center gap-3 cursor-pointer mt-2">
          <div class="relative inline-flex items-center">
            <input type="checkbox" bind:checked={isActive} class="sr-only peer">
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </div>
          <span class="text-sm font-medium text-gray-900">Active</span>
        </label>
        
        {#if error}
          <p class="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
        {/if}
      </div>

      <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
        <button 
          type="button" 
          onclick={closeEdit}
          class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="button"
          disabled={saving || !name.trim()}
          onclick={save}
          class="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {#if saving}
            <Loader2 class="w-4 h-4 animate-spin" />
            Saving...
          {:else}
            Save
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}