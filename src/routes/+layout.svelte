<script lang="ts">
  import "../app.css";
  import { LogIn, Menu, ShoppingBag, UserRound, X } from "lucide-svelte";
  import { page } from "$app/stores";
  import { authStore } from "$lib/stores/auth";
  import type { Snippet } from "svelte";
  import type { LayoutData } from "./$types";

  let { data, children }: { data: LayoutData; children: Snippet } = $props();
  let menuOpen = $state(false);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/bookings", label: "Bookings" },
    { href: "/events", label: "Events" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ];
</script>

<svelte:head>
  <title>{data.tenant?.brandName ?? "FavCRM Storefront"}</title>
  <meta
    name="description"
    content="A production-ready FavCRM headless storefront template."
  />
</svelte:head>

<header class="site-header">
  <a class="brand-lockup" href="/" aria-label="Home">
    {#if data.tenant?.brandLogoUrl}
      <img src={data.tenant.brandLogoUrl} alt="" />
    {:else}
      <span class="brand-mark">F</span>
    {/if}
    <span>{data.tenant?.brandName ?? "FavCRM Storefront"}</span>
  </a>

  <nav class:open={menuOpen} aria-label="Main navigation">
    {#each navItems as item}
      <a
        href={item.href}
        class:active={$page.url.pathname === item.href}
        onclick={() => (menuOpen = false)}
      >
        {item.label}
      </a>
    {/each}
  </nav>

  <div class="header-actions">
    <a class="icon-button" href="/shop" aria-label="Shop">
      <ShoppingBag size={19} />
    </a>
    {#if $authStore.jwt}
      <a class="icon-button" href="/member" aria-label="Member profile">
        <UserRound size={19} />
      </a>
    {:else}
      <a class="text-button" href="/login">
        <LogIn size={18} />
        <span>Sign in</span>
      </a>
    {/if}
    <button
      class="icon-button mobile-menu"
      type="button"
      aria-label="Toggle menu"
      onclick={() => (menuOpen = !menuOpen)}
    >
      {#if menuOpen}<X size={20} />{:else}<Menu size={20} />{/if}
    </button>
  </div>
</header>

<main>
  {@render children()}
</main>

<footer class="site-footer">
  <span>{data.tenant?.brandName ?? "FavCRM Storefront"}</span>
  <span>Powered by FavCRM headless commerce</span>
</footer>
