<script lang="ts">
  import { page } from "$app/stores";
  import {
    CalendarDays,
    Gift,
    LayoutDashboard,
    Megaphone,
    Package,
    Settings,
    ShoppingBag,
    Tag,
    Users,
    X,
  } from "lucide-svelte";

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  interface AdminNavItem {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    exact?: boolean;
  }

  interface AdminNavGroup {
    label?: string;
    items: AdminNavItem[];
  }

  const navGroups: AdminNavGroup[] = [
    {
      items: [
        {
          href: "/admin",
          label: "Dashboard",
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      label: "Commerce",
      items: [
        { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
        { href: "/admin/products", label: "Products", icon: Package },
        { href: "/admin/categories", label: "Categories", icon: Tag },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
        { href: "/admin/customers", label: "Customers", icon: Users },
      ],
    },
    {
      label: "Marketing",
      items: [
        { href: "/admin/promotions", label: "Promotions", icon: Gift },
        { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
      ],
    },
    {
      items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
    },
  ];

  function isActiveRoute(href: string, exact = false): boolean {
    if (exact) return $page.url.pathname === href;
    return $page.url.pathname.startsWith(href);
  }
</script>

{#if isOpen}
  <button
    class="admin-sidebar-overlay"
    type="button"
    aria-label="Close menu"
    onclick={onClose}
  ></button>
{/if}

<aside class="admin-sidebar" class:open={isOpen}>
  <div class="admin-sidebar-header">
    <span>Admin</span>
    <button
      class="admin-close-button"
      type="button"
      aria-label="Close menu"
      onclick={onClose}
    >
      <X size={20} />
    </button>
  </div>

  <nav class="admin-sidebar-nav" aria-label="Admin navigation">
    {#each navGroups as group}
      <div class="admin-nav-group">
        {#if group.label}
          <p>{group.label}</p>
        {/if}
        {#each group.items as item}
          <a
            href={item.href}
            class:active={isActiveRoute(item.href, item.exact)}
            onclick={onClose}
          >
            <item.icon size={16} />
            <span>{item.label}</span>
          </a>
        {/each}
      </div>
    {/each}
  </nav>

  <div class="admin-sidebar-footer">
    <a href="/">Back to site</a>
  </div>
</aside>
