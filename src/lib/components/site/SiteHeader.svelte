<script lang="ts">
  import {
    ShoppingBag,
    UserRound,
    Search,
    LogIn,
    LayoutDashboard,
  } from "lucide-svelte";
  import { page } from "$app/stores";
  import { authStore } from "$lib/stores/auth";
  import { cartCount } from "$lib/stores/cart";
  import IconMark from "./IconMark.svelte";
  import { onMount } from "svelte";

  let {
    brandName = "FavCRM Storefront",
    brandLogoUrl = null,
  }: {
    brandName?: string;
    brandLogoUrl?: string | null;
  } = $props();

  let menuOpen = $state(false);
  let isScrolled = $state(false);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/bookings", label: "Bookings" },
    { href: "/events", label: "Events" },
    { href: "/blog", label: "Journal" },
    { href: "/contact", label: "Contact" },
  ];

  onMount(() => {
    const handleScroll = () => {
      isScrolled = window.scrollY > 20;
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  });

  // Lock body scroll when mobile menu is open
  $effect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = menuOpen ? 'hidden' : '';
    }
  });
</script>

<header class="site-header" class:scrolled={isScrolled}>
  <div class="site-container site-header-inner">
    <a class="brand-lockup" href="/" aria-label="Home" onclick={() => (menuOpen = false)}>
      {#if brandLogoUrl}
        <img class="brand-mark" src={brandLogoUrl} alt="" />
      {:else}
        <div class="brand-icon-wrapper">
          <IconMark name={brandName} />
        </div>
      {/if}
      <span class="brand-text">{brandName}</span>
    </a>

    <!-- Desktop Navigation -->
    <nav class="desktop-nav" aria-label="Main navigation">
      {#each navItems as item}
        <a
          href={item.href}
          class="nav-link"
          class:active={$page.url.pathname === item.href ||
            (item.href !== "/" && $page.url.pathname.startsWith(item.href))}
        >
          {item.label}
        </a>
      {/each}
    </nav>

    <!-- Actions -->
    <div class="header-actions">
      <a class="action-btn" href="/cart" aria-label="Cart">
        <ShoppingBag size={20} strokeWidth={1.5} />
        {#if $cartCount > 0}
          <span class="cart-badge" aria-label="{$cartCount} items in cart">
            {$cartCount}
          </span>
        {/if}
      </a>
      
      <div class="desktop-only flex-actions">
        <a class="action-btn" href="/admin" aria-label="Admin dashboard" title="Admin">
          <LayoutDashboard size={20} strokeWidth={1.5} />
        </a>
        {#if $authStore.jwt}
          <a class="btn-site btn-site--primary" href="/member" aria-label="Member profile" title="Profile">
            <UserRound size={16} strokeWidth={2} />
            <span>Account</span>
          </a>
        {:else}
          <a class="btn-site btn-site--primary" href="/login">
            <LogIn size={16} strokeWidth={2} />
            <span>Sign in</span>
          </a>
        {/if}
      </div>

      <button
        class="mobile-toggle"
        type="button"
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
        onclick={() => (menuOpen = !menuOpen)}
      >
        <div class="hamburger-icon" class:open={menuOpen}>
          <span></span>
          <span></span>
        </div>
      </button>
    </div>
  </div>
</header>

<!-- Mobile Full Screen Menu -->
{#if menuOpen}
  <div class="mobile-menu-overlay animate-in fade-in duration-200">
    <nav class="mobile-nav animate-in slide-in-from-bottom-4 duration-300">
      {#each navItems as item}
        <a
          href={item.href}
          class="mobile-nav-link"
          class:active={$page.url.pathname === item.href ||
            (item.href !== "/" && $page.url.pathname.startsWith(item.href))}
          onclick={() => (menuOpen = false)}
        >
          {item.label}
        </a>
      {/each}
    </nav>
    
    <div class="mobile-footer animate-in slide-in-from-bottom-8 duration-500">
      <a class="mobile-footer-link" href="/admin" onclick={() => (menuOpen = false)}>
        <LayoutDashboard size={18} />
        Admin Dashboard
      </a>
      {#if $authStore.jwt}
        <a class="mobile-footer-link" href="/member" onclick={() => (menuOpen = false)}>
          <UserRound size={18} />
          Member Portal
        </a>
      {:else}
        <a class="mobile-footer-link highlight" href="/login" onclick={() => (menuOpen = false)}>
          <LogIn size={18} />
          Sign In
        </a>
      {/if}
    </div>
  </div>
{/if}

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px) saturate(160%);
    -webkit-backdrop-filter: blur(12px) saturate(160%);
    transition: box-shadow 300ms ease, border-color 300ms ease, padding 300ms ease;
    border-bottom: 1px solid transparent;
  }

  .site-header.scrolled {
    border-bottom-color: var(--line, #e5e7eb);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.02);
  }

  .site-header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 72px;
    transition: height 300ms ease;
  }

  .site-header.scrolled .site-header-inner {
    height: 64px;
  }

  /* Brand Lockup */
  .brand-lockup {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    z-index: 60; /* Above mobile menu overlay */
    position: relative;
  }

  .brand-icon-wrapper, .brand-mark {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: var(--ink, #111);
    color: white;
    display: grid;
    place-items: center;
    object-fit: cover;
  }

  .brand-text {
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--ink, #111);
  }

  /* Desktop Nav */
  .desktop-nav {
    display: none;
    align-items: center;
    gap: 8px;
    background: transparent;
  }

  .nav-link {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--ink-soft, #2a2a2a);
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 999px;
    transition: all 200ms ease;
  }

  .nav-link:hover {
    color: var(--ink, #111);
    background: rgba(17, 17, 17, 0.04);
  }

  .nav-link.active {
    color: var(--ink, #111);
    background: rgba(17, 17, 17, 0.06);
    font-weight: 600;
  }

  /* Actions */
  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 60; /* Above mobile menu */
    position: relative;
  }

  .flex-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .action-btn {
    position: relative;
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    color: var(--ink, #111);
    border-radius: 50%;
    transition: background 200ms ease, transform 150ms ease;
  }

  .action-btn:hover {
    background: rgba(17, 17, 17, 0.05);
    transform: translateY(-1px);
  }

  .action-btn:active {
    transform: scale(0.96);
  }

  .cart-badge {
    position: absolute;
    top: 4px;
    right: 2px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 99px;
    background: var(--ink, #111);
    color: white;
    font-size: 10px;
    font-weight: 700;
    line-height: 18px;
    text-align: center;
    box-shadow: 0 0 0 2px white;
  }

  /* Mobile Toggle */
  .mobile-toggle {
    display: block;
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 50%;
    display: grid;
    place-items: center;
    padding: 0;
  }

  .hamburger-icon {
    width: 20px;
    height: 14px;
    position: relative;
  }

  .hamburger-icon span {
    display: block;
    position: absolute;
    height: 2px;
    width: 100%;
    background: var(--ink, #111);
    border-radius: 2px;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .hamburger-icon span:nth-child(1) { top: 0px; }
  .hamburger-icon span:nth-child(2) { top: 12px; }

  .hamburger-icon.open span:nth-child(1) {
    top: 6px;
    transform: rotate(45deg);
  }
  .hamburger-icon.open span:nth-child(2) {
    top: 6px;
    transform: rotate(-45deg);
  }

  /* Full Screen Mobile Overlay */
  .mobile-menu-overlay {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    padding: 100px 24px 40px;
    overflow-y: auto;
  }

  .mobile-nav {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
  }

  .mobile-nav-link {
    font-family: var(--font-display);
    font-size: 2.25rem;
    font-weight: 400;
    letter-spacing: -0.02em;
    color: var(--ink-soft, #2a2a2a);
    text-decoration: none;
    transition: color 200ms ease, padding-left 200ms ease;
  }

  .mobile-nav-link.active {
    color: var(--ink, #111);
    font-weight: 500;
  }

  .mobile-nav-link:active {
    color: var(--ink, #111);
    padding-left: 8px;
  }

  .mobile-footer {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 40px;
    border-top: 1px solid var(--line, #e5e7eb);
  }

  .mobile-footer-link {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--ink, #111);
    text-decoration: none;
    padding: 12px 0;
  }

  .mobile-footer-link.highlight {
    color: var(--accent, #1e3a8a);
  }

  /* Desktop / Mobile Switch */
  .desktop-only { display: none; }

  @media (min-width: 820px) {
    .desktop-nav { display: flex; }
    .desktop-only { display: flex; }
    .mobile-toggle { display: none; }
  }
</style>