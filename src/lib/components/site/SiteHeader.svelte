<script lang="ts">
  import {
    LayoutDashboard,
    LogIn,
    Menu,
    ShoppingBag,
    UserRound,
    X,
  } from "lucide-svelte";
  import { page } from "$app/stores";
  import { authStore } from "$lib/stores/auth";
  import IconMark from "./IconMark.svelte";

  let {
    brandName = "FavCRM Storefront",
    brandLogoUrl = null,
  }: {
    brandName?: string;
    brandLogoUrl?: string | null;
  } = $props();

  let menuOpen = $state(false);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/bookings", label: "Bookings" },
    { href: "/events", label: "Events" },
    { href: "/blog", label: "Journal" },
    { href: "/contact", label: "Contact" },
  ];
</script>

<header class="site-header">
  <div class="site-container site-header-inner">
    <a class="brand-lockup" href="/" aria-label="Home">
      {#if brandLogoUrl}
        <img class="brand-mark" src={brandLogoUrl} alt="" />
      {:else}
        <IconMark name={brandName} />
      {/if}
      <span>{brandName}</span>
    </a>

    <nav class="site-nav" class:open={menuOpen} aria-label="Main navigation">
      {#each navItems as item}
        <a
          href={item.href}
          class:active={$page.url.pathname === item.href ||
            (item.href !== "/" && $page.url.pathname.startsWith(item.href))}
          onclick={() => (menuOpen = false)}
        >
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="header-actions">
      <a class="icon-button" href="/shop" aria-label="Shop">
        <ShoppingBag size={18} strokeWidth={1.6} />
      </a>
      <a
        class="icon-button desktop-only"
        href="/admin"
        aria-label="Admin dashboard"
      >
        <LayoutDashboard size={18} strokeWidth={1.6} />
      </a>
      {#if $authStore.jwt}
        <a class="icon-button" href="/member" aria-label="Member profile">
          <UserRound size={18} strokeWidth={1.6} />
        </a>
      {:else}
        <a class="text-button" href="/login">
          <LogIn size={16} strokeWidth={1.6} />
          <span>Sign in</span>
        </a>
      {/if}
      <button
        class="icon-button mobile-menu"
        type="button"
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
        onclick={() => (menuOpen = !menuOpen)}
      >
        {#if menuOpen}
          <X size={20} strokeWidth={1.6} />
        {:else}
          <Menu size={20} strokeWidth={1.6} />
        {/if}
      </button>
    </div>
  </div>
</header>
