<script lang="ts">
  import { page } from "$app/stores";
  import AdminSidebar from "$lib/components/admin/AdminSidebar.svelte";
  import { adminAuthStore, adminLogout } from "$lib/stores/admin-auth";
  import { Menu, LogOut } from "lucide-svelte";
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();

  let sidebarOpen = $state(false);

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function closeSidebar() {
    sidebarOpen = false;
  }

  function handleLogout() {
    adminLogout();
    window.location.href = "/admin/login";
  }

  // Close sidebar on route change
  $effect(() => {
    $page.route.id;
    closeSidebar();
  });
</script>

<div class="h-screen bg-gray-50 flex flex-col overflow-hidden">
  <!-- Top bar -->
  <header class="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
    <div class="flex items-center gap-3">
      <button
        onclick={toggleSidebar}
        class="lg:hidden p-1.5 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
        aria-label="Toggle menu"
      >
        <Menu class="w-5 h-5" />
      </button>
      <span class="text-sm font-medium text-gray-700">
        {$adminAuthStore.companyName ?? "Admin"}
      </span>
    </div>
    <div class="flex items-center gap-3">
      <span class="text-xs text-gray-500 hidden sm:inline">
        {$adminAuthStore.user?.email ?? ""}
      </span>
      <button
        onclick={handleLogout}
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
      >
        <LogOut class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">Logout</span>
      </button>
    </div>
  </header>

  <div class="flex flex-1 min-h-0">
    <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
    <main class="flex-1 min-w-0 overflow-y-auto">
      <div class="p-4 sm:p-6 lg:p-8">
        {@render children()}
      </div>
    </main>
  </div>
</div>
