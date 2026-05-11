<script lang="ts">
  import { CreditCard, Truck, WalletCards } from 'lucide-svelte';
</script>

<div class="mb-8">
  <div class="flex items-center gap-3 mb-2">
    <div class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
      <CreditCard class="w-4 h-4 text-slate-300" />
    </div>
    <h1 class="text-xl font-semibold text-gray-900">Checkout & Commerce</h1>
  </div>
  <p class="text-sm text-gray-500 ml-11">
    Configure accepted payment methods and delivery options.
  </p>
</div>

<div class="space-y-6">
  <!-- Payment Methods Placeholder -->
  <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <WalletCards class="w-4 h-4 text-gray-500" />
        <h2 class="text-sm font-semibold text-gray-700">Payment Methods</h2>
      </div>
      <button class="text-xs font-medium text-emerald-600 hover:text-emerald-700">Add Method</button>
    </div>
    <div class="p-6">
      <p class="text-sm text-gray-500 text-center py-8">
        Payment method configuration coming soon.
      </p>
    </div>
  </div>

  <!-- Shipping Methods Placeholder -->
  <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <Truck class="w-4 h-4 text-gray-500" />
        <h2 class="text-sm font-semibold text-gray-700">Shipping Methods</h2>
      </div>
      <button class="text-xs font-medium text-emerald-600 hover:text-emerald-700">Add Method</button>
    </div>
    <div class="p-6">
      <p class="text-sm text-gray-500 text-center py-8">
        Shipping method configuration coming soon.
      </p>
    </div>
  </div>
</div>