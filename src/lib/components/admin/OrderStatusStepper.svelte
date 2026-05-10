<script lang="ts">
  import type { OrderStatus } from "$lib/types/admin";
  import { Check } from "lucide-svelte";

  interface Props {
    status: OrderStatus;
  }

  let { status }: Props = $props();

  const steps: { key: OrderStatus; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "processing", label: "Processing" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
  ];

  const stepIndex = $derived(steps.findIndex((s) => s.key === status));
  const isCancelled = $derived(status === "cancelled");
  const isRefunded = $derived(status === "refunded");
  const isTerminal = $derived(isCancelled || isRefunded);
</script>

{#if isTerminal}
  <!-- Terminal status: show badge instead of stepper -->
  <div class="flex items-center gap-2">
    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold {isCancelled ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}">
      {isCancelled ? "Cancelled" : "Refunded"}
    </span>
    <span class="text-xs text-gray-400">Order will not progress further</span>
  </div>
{:else}
  <div class="flex items-center">
    {#each steps as step, i (step.key)}
      {#if i > 0}
        <!-- Connector -->
        <div class="flex-1 h-0.5 mx-1 {i <= stepIndex ? 'bg-emerald-400' : 'bg-gray-200'}"></div>
      {/if}
      <!-- Step -->
      <div class="flex flex-col items-center gap-1.5">
        <div
          class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all
            {i < stepIndex
              ? 'bg-emerald-500 text-white'
              : i === stepIndex
                ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                : 'bg-gray-100 text-gray-400'}"
        >
          {#if i < stepIndex}
            <Check class="w-3.5 h-3.5" />
          {:else}
            {i + 1}
          {/if}
        </div>
        <span class="text-[10px] leading-tight {i <= stepIndex ? 'text-gray-700 font-medium' : 'text-gray-400'}">
          {step.label}
        </span>
      </div>
    {/each}
  </div>
{/if}
