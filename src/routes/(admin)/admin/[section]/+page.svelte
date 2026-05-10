<script lang="ts">
  import {
    ArrowUpRight,
    CalendarDays,
    FileText,
    Gift,
    Menu,
    Package,
    Settings,
    ShoppingBag,
    Tag,
    Users,
  } from "lucide-svelte";
  import AdminSidebar from "$lib/components/admin/AdminSidebar.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let sidebarOpen = $state(false);

  const portalUrl = $derived(`https://app.favcrm.io${data.section.portalPath}`);

  const iconMap = {
    orders: ShoppingBag,
    products: Package,
    categories: Tag,
    bookings: CalendarDays,
    customers: Users,
    events: Users,
    promotions: Gift,
    announcements: FileText,
    blog: FileText,
    settings: Settings,
  };

  const SectionIcon = $derived(
    iconMap[data.sectionKey as keyof typeof iconMap] ?? Settings,
  );
</script>

<svelte:head>
  <title>{data.section.title} | {data.tenant.brandName}</title>
</svelte:head>

<section class="admin-app-shell">
  <header class="admin-topbar">
    <div class="admin-topbar-title">
      <button
        class="admin-menu-button"
        type="button"
        aria-label="Toggle admin menu"
        onclick={() => (sidebarOpen = !sidebarOpen)}
      >
        <Menu size={20} />
      </button>
      <span>{data.tenant.brandName}</span>
    </div>
    <a class="admin-text-action" href="https://app.favcrm.io" target="_blank" rel="noreferrer">
      <Settings size={15} />
      <span>Open FavCRM</span>
    </a>
  </header>

  <div class="admin-main-frame">
    <AdminSidebar isOpen={sidebarOpen} onClose={() => (sidebarOpen = false)} />

    <div class="admin-content">
      <div class="admin-page-header">
        <div>
          <h1>{data.section.title}</h1>
          <p>{data.section.description}</p>
        </div>
        <a class="admin-primary-action" href={portalUrl} target="_blank" rel="noreferrer">
          Open in FavCRM
          <ArrowUpRight size={16} />
        </a>
      </div>

      <section class="admin-panel admin-section-panel">
        <span class="admin-section-icon">
          <SectionIcon size={24} />
        </span>
        <h2>{data.section.title}</h2>
        <p>
          This public template keeps merchant write operations inside the hosted
          FavCRM admin app. The sidebar routes stay local so the template can
          later grow first-party admin screens without leaking API secrets.
        </p>
        <div class="admin-section-actions">
          <a class="admin-primary-action" href={portalUrl} target="_blank" rel="noreferrer">
            Continue in FavCRM
            <ArrowUpRight size={16} />
          </a>
          <a class="admin-text-action" href="/admin">Dashboard</a>
        </div>
      </section>
    </div>
  </div>
</section>
