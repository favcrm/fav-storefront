<script lang="ts">
  import { CreditCard } from 'lucide-svelte';
  import PaymentMethodsTable from '$lib/components/admin/settings/PaymentMethodsTable.svelte';
  import ShippingMethodsTable from '$lib/components/admin/settings/ShippingMethodsTable.svelte';
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
  <PaymentMethodsTable />
  <ShippingMethodsTable />
</div>