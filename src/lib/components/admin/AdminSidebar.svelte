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
        { href: "https://app.favcrm.io/orders", label: "Orders", icon: ShoppingBag },
        { href: "https://app.favcrm.io/products", label: "Products", icon: Package },
        { href: "https://app.favcrm.io/categories", label: "Categories", icon: Tag },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: "https://app.favcrm.io/bookings", label: "Bookings", icon: CalendarDays },
        { href: "https://app.favcrm.io/customers", label: "Customers", icon: Users },
      ],
    },
    {
      label: "Marketing",
      items: [
        { href: "https://app.favcrm.io/promotions", label: "Promotions", icon: Gift },
        { href: "https://app.favcrm.io/announcements", label: "Announcements", icon: Megaphone },
      ],
    },
    {
      items: [
        { href: "https://app.favcrm.io/settings/customer-portal", label: "Settings", icon: Settings },
      ],
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
            target={item.href.startsWith("https://") ? "_blank" : undefined}
            rel={item.href.startsWith("https://") ? "noreferrer" : undefined}
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
