<script lang="ts">
  import {
    ArrowUpRight,
    CalendarDays,
    FileText,
    Menu,
    Package,
    Settings,
    ShoppingBag,
    Users,
  } from "lucide-svelte";
  import AdminSidebar from "$lib/components/admin/AdminSidebar.svelte";
  import { formatMoney } from "$lib/format";
  import { productImage, productPrice } from "$lib/product";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let sidebarOpen = $state(false);

  const portalUrl = "https://app.favcrm.io/settings/customer-portal";

  const metrics = $derived([
    {
      label: "Products",
      value: data.products.length,
      href: "/admin/products",
      icon: Package,
      tone: "emerald",
    },
    {
      label: "Categories",
      value: data.categories.length,
      href: "/admin/categories",
      icon: ShoppingBag,
      tone: "sky",
    },
    {
      label: "Services",
      value: data.services.length,
      href: "/admin/bookings",
      icon: CalendarDays,
      tone: "amber",
    },
    {
      label: "Events",
      value: data.events.length,
      href: "/admin/events",
      icon: Users,
      tone: "violet",
    },
  ]);

  const moduleRows = $derived([
    ["Commerce", data.products.length > 0 || data.categories.length > 0],
    ["Bookings", data.services.length > 0],
    ["Events", data.events.length > 0],
    ["Blog", data.blogTotal > 0],
  ]);
</script>

<svelte:head>
  <title>Admin | {data.tenant.brandName}</title>
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
    <a class="admin-text-action" href={portalUrl} target="_blank" rel="noreferrer">
      <Settings size={15} />
      <span>Open FavCRM</span>
    </a>
  </header>

  <div class="admin-main-frame">
    <AdminSidebar isOpen={sidebarOpen} onClose={() => (sidebarOpen = false)} />

    <div class="admin-content">
      <div class="admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Live storefront readiness from the FavCRM customer portal API.</p>
        </div>
        <a class="admin-primary-action" href="/admin/settings">
          Customer portal settings
          <ArrowUpRight size={16} />
        </a>
      </div>

      <div class="admin-metric-grid">
        {#each metrics as metric}
          <a class="admin-metric-card" data-tone={metric.tone} href={metric.href}>
            <div>
              <span class="admin-metric-icon">
                <metric.icon size={18} />
              </span>
              <ArrowUpRight class="admin-card-arrow" size={17} />
            </div>
            <strong>{metric.value.toLocaleString()}</strong>
            <span>{metric.label}</span>
          </a>
        {/each}
      </div>

      <div class="admin-dashboard-grid">
        <section class="admin-panel admin-wide-panel">
          <div class="admin-panel-header">
            <h2>Catalog Preview</h2>
            <a href="/admin/products">Manage</a>
          </div>
          {#if data.products.length}
            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {#each data.products as product}
                    {@const image = productImage(product)}
                    <tr>
                      <td>
                        <span class="admin-product-cell">
                          {#if image}
                            <img src={image} alt="" />
                          {:else}
                            <span class="admin-product-placeholder"></span>
                          {/if}
                          <span>{product.name}</span>
                        </span>
                      </td>
                      <td>{formatMoney(productPrice(product))}</td>
                      <td><span class="admin-status-pill">Published</span></td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <div class="admin-empty-panel">
              <Package size={28} />
              <p>Add products in FavCRM to populate the storefront catalog.</p>
            </div>
          {/if}
        </section>

        <section class="admin-panel">
          <div class="admin-panel-header">
            <h2>Modules</h2>
            <span>{data.tenant.modules.length} enabled</span>
          </div>
          <div class="admin-module-list">
            {#each moduleRows as [label, configured]}
              <div>
                <span>{label}</span>
                <span class:ready={configured}>{configured ? "Ready" : "Empty"}</span>
              </div>
            {/each}
          </div>
        </section>

        <section class="admin-panel">
          <div class="admin-panel-header">
            <h2>Content</h2>
            <a href="/admin/blog">Manage</a>
          </div>
          <div class="admin-content-list">
            {#if data.posts.length}
              {#each data.posts as post}
                <a href="/admin/blog">
                  <FileText size={16} />
                  <span>{post.title}</span>
                </a>
              {/each}
            {:else}
              <p>No blog posts are published yet.</p>
            {/if}
          </div>
        </section>
      </div>
    </div>
  </div>
</section>
