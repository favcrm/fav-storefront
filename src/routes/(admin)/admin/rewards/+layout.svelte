<script lang="ts">
  import { page } from "$app/stores";
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();

  const tabs = [
    { href: "/admin/rewards/earning-rules", label: "Earning Rules" },
    { href: "/admin/rewards/automatic-rewards", label: "Auto Rewards" },
    { href: "/admin/rewards/gift-offers", label: "Gift Offers" },
    { href: "/admin/rewards/redemptions", label: "Redemptions" },
  ];

  function isActive(href: string): boolean {
    return $page.url.pathname.startsWith(href);
  }
</script>

<div>
  <div class="border-b border-gray-200 mb-6">
    <nav class="flex gap-1 -mb-px overflow-x-auto">
      {#each tabs as tab (tab.href)}
        <a
          href={tab.href}
          class="px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
          class:border-blue-600={isActive(tab.href)}
          class:text-blue-600={isActive(tab.href)}
          class:border-transparent={!isActive(tab.href)}
          class:text-gray-500={!isActive(tab.href)}
          class:hover:text-gray-700={!isActive(tab.href)}
          class:hover:border-gray-300={!isActive(tab.href)}
        >
          {tab.label}
        </a>
      {/each}
    </nav>
  </div>
  {@render children()}
</div>
