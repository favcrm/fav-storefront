<script lang="ts">
  import { goto } from "$app/navigation";
  import { adminInvoicesApi, adminCustomersApi } from "$lib/api/admin";
  import type { Account, CreateInvoiceInput, CreateLineItemInput } from "$lib/types/admin";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Select from "$lib/components/ui/Select.svelte";
  import { Plus, Trash2, Search } from "lucide-svelte";

  // Customer
  let accountId = $state<string | null>(null);
  let accountName = $state("");
  let customerSearch = $state("");
  let customerResults = $state<Account[]>([]);
  let showCustomerDropdown = $state(false);

  // Line items
  let lineItems = $state<{ description: string; quantity: string; unitPrice: string; total: string }[]>([
    { description: "", quantity: "1", unitPrice: "", total: "" },
  ]);

  let taxAmount = $state("0");
  let currency = $state("HKD");
  let notes = $state("");

  // Shipping address
  let showAddress = $state(false);
  let addrLine1 = $state("");
  let addrLine2 = $state("");
  let addrCity = $state("");
  let addrCountry = $state("Hong Kong");

  let saving = $state(false);
  let error = $state("");

  const currencyOptions = [
    { value: "HKD", label: "HKD" },
    { value: "USD", label: "USD" },
    { value: "CNY", label: "CNY" },
  ];

  // Customer search
  let searchTimeout: ReturnType<typeof setTimeout>;
  function handleCustomerSearch() {
    clearTimeout(searchTimeout);
    if (!customerSearch.trim()) {
      customerResults = [];
      showCustomerDropdown = false;
      return;
    }
    searchTimeout = setTimeout(async () => {
      try {
        const res = await adminCustomersApi.list({ search: customerSearch, pageSize: 5 });
        customerResults = res.items;
        showCustomerDropdown = true;
      } catch {
        customerResults = [];
      }
    }, 300);
  }

  function selectCustomer(customer: Account) {
    accountId = customer.id;
    accountName = customer.name;
    customerSearch = "";
    showCustomerDropdown = false;
    customerResults = [];
  }

  function clearCustomer() {
    accountId = null;
    accountName = "";
  }

  // Line items
  function addLineItem() {
    lineItems = [...lineItems, { description: "", quantity: "1", unitPrice: "", total: "" }];
  }

  function removeLineItem(index: number) {
    lineItems = lineItems.filter((_, i) => i !== index);
  }

  function calcLineTotal(index: number) {
    const item = lineItems[index];
    const qty = parseInt(item.quantity, 10) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    lineItems[index].total = (qty * price).toFixed(2);
  }

  const subtotal = $derived(
    lineItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)
  );

  const grandTotal = $derived(subtotal + (parseFloat(taxAmount) || 0));

  async function handleCreate() {
    const validItems = lineItems.filter((item) => item.description.trim());
    if (validItems.length === 0) {
      error = "Add at least one item.";
      return;
    }

    saving = true;
    error = "";
    try {
      const items: CreateLineItemInput[] = validItems.map((item, i) => ({
        description: item.description.trim(),
        quantity: parseInt(item.quantity, 10) || 1,
        unitPrice: item.unitPrice || undefined,
        total: item.total || undefined,
        sortOrder: i,
      }));

      const input: CreateInvoiceInput = {
        accountId: accountId || null,
        amount: subtotal.toFixed(2),
        taxAmount: taxAmount || "0",
        total: grandTotal.toFixed(2),
        currency,
        status: "SENT",
        lineItems: items,
      };

      if (notes.trim()) input.notes = notes.trim();

      if (showAddress && addrLine1.trim()) {
        input.billingAddress = {
          line1: addrLine1.trim(),
          line2: addrLine2.trim() || undefined,
          city: addrCity.trim() || undefined,
          country: addrCountry.trim() || undefined,
        };
      }

      const result = await adminInvoicesApi.create(input);
      goto(`/admin/orders/manual/${result.id}`);
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Failed to create order";
    } finally {
      saving = false;
    }
  }
</script>

<div>
  <a href="/admin/orders" class="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
    &larr; Back to Orders
  </a>

  <h1 class="text-xl font-semibold text-gray-900 mb-6">Create Order</h1>
  <p class="text-sm text-gray-500 -mt-4 mb-6">For phone, walk-in, WhatsApp, or custom sales</p>

  {#if error}
    <div class="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">{error}</div>
  {/if}

  <form novalidate onsubmit={(e) => { e.preventDefault(); handleCreate(); }}>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Customer Picker -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-3">Customer</h2>
          {#if accountId}
            <div class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
              <span class="text-sm font-medium text-gray-900">{accountName}</span>
              <button type="button" onclick={clearCustomer} class="text-xs text-gray-500 hover:text-red-600">Remove</button>
            </div>
          {:else}
            <div class="relative">
              <div class="relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  bind:value={customerSearch}
                  oninput={handleCustomerSearch}
                  onfocus={() => customerSearch && (showCustomerDropdown = true)}
                  onblur={() => setTimeout(() => (showCustomerDropdown = false), 200)}
                  placeholder="Search customers..."
                  class="form-input"
                  style="padding-left: 2.5rem;"
                />
              </div>
              {#if showCustomerDropdown && customerResults.length > 0}
                <div class="absolute z-10 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg max-h-48 overflow-y-auto">
                  {#each customerResults as customer (customer.id)}
                    <button
                      type="button"
                      class="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors"
                      onmousedown={() => selectCustomer(customer)}
                    >
                      <div class="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div class="text-xs text-gray-500">
                        {[customer.email, customer.phone].filter(Boolean).join(" · ") || "No contact info"}
                      </div>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
            <p class="text-xs text-gray-400 mt-1">Optional — leave blank for walk-in</p>
          {/if}
        </div>

        <!-- Items -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-medium text-gray-900">Items</h2>
            <button type="button" onclick={addLineItem} class="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800">
              <Plus class="w-3.5 h-3.5" /> Add Item
            </button>
          </div>

          <!-- Column labels -->
          <div class="flex items-center gap-2 mb-2 text-xs text-gray-500 font-medium">
            <div class="flex-1">Description</div>
            <div class="w-16 text-center">Qty</div>
            <div class="w-28 text-right">Price</div>
            <div class="w-28 text-right">Total</div>
            <div class="w-8"></div>
          </div>

          <div class="space-y-2">
            {#each lineItems as item, i (i)}
              <div class="flex items-start gap-2">
                <div class="flex-1">
                  <input type="text" bind:value={item.description} placeholder="Product or service" class="form-input text-sm" />
                </div>
                <div class="w-16">
                  <input type="number" bind:value={item.quantity} oninput={() => calcLineTotal(i)} min="1" class="form-input text-sm text-center" />
                </div>
                <div class="w-28">
                  <input type="text" bind:value={item.unitPrice} oninput={() => calcLineTotal(i)} placeholder="0.00" class="form-input text-sm text-right" />
                </div>
                <div class="w-28">
                  <input type="text" bind:value={item.total} placeholder="0.00" class="form-input text-sm text-right" />
                </div>
                {#if lineItems.length > 1}
                  <button type="button" onclick={() => removeLineItem(i)} class="p-2 text-gray-400 hover:text-red-600 transition-colors mt-0.5">
                    <Trash2 class="w-4 h-4" />
                  </button>
                {:else}
                  <div class="w-8"></div>
                {/if}
              </div>
            {/each}
          </div>

          <!-- Totals -->
          <div class="border-t border-gray-200 mt-4 pt-3 space-y-1.5">
            <div class="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span class="tabular-nums font-medium">{subtotal.toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-sm text-gray-600 items-center">
              <span>Tax</span>
              <input type="text" bind:value={taxAmount} class="w-28 text-right text-sm border border-gray-200 rounded px-2 py-1" />
            </div>
            <div class="flex justify-between text-base font-semibold text-gray-900 pt-1">
              <span>Total</span>
              <span class="tabular-nums">{grandTotal.toFixed(2)} {currency}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <h2 class="font-medium text-gray-900 mb-2">Notes</h2>
          <textarea bind:value={notes} rows="2" placeholder="Internal notes (not shown to customer)" class="form-input text-sm"></textarea>
        </div>

        <!-- Shipping Address -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <button type="button" onclick={() => (showAddress = !showAddress)} class="text-sm font-medium text-gray-900 hover:text-blue-600">
            {showAddress ? "- Hide" : "+ Add"} Shipping Address
          </button>
          {#if showAddress}
            <div class="mt-3 space-y-3">
              <Input name="addrLine1" label="Address" bind:value={addrLine1} placeholder="Street address" />
              <Input name="addrLine2" label="Address Line 2" bind:value={addrLine2} placeholder="Apt, suite, unit (optional)" />
              <div class="grid grid-cols-2 gap-3">
                <Input name="addrCity" label="City" bind:value={addrCity} />
                <Input name="addrCountry" label="Country" bind:value={addrCountry} />
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <div class="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <Select name="currency" label="Currency" bind:value={currency} options={currencyOptions} />
        </div>

        <div class="space-y-2">
          <Button variant="primary" type="submit" disabled={saving} class="w-full">
            {saving ? "Creating..." : "Create Order"}
          </Button>
          <a href="/admin/orders">
            <Button variant="ghost" type="button" class="w-full">Cancel</Button>
          </a>
        </div>
      </div>
    </div>
  </form>
</div>
