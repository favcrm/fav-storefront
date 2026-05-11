<script lang="ts">
  import IconMark from "./IconMark.svelte";

  let {
    brandName = "FavCRM Storefront",
  }: { brandName?: string } = $props();

  const year = new Date().getFullYear();

  const navLinks = [
    { href: "/shop", label: "Shop" },
    { href: "/bookings", label: "Bookings" },
    { href: "/events", label: "Events" },
    { href: "/blog", label: "Journal" },
    { href: "/contact", label: "Contact" },
  ];
</script>

<footer class="site-footer">
  <div class="site-container">
    <div class="footer-content">
      
      <div class="footer-top">
        <a class="footer-brand" href="/">
          <div class="brand-icon-wrapper">
            <IconMark name={brandName} />
          </div>
          <span class="brand-text">{brandName}</span>
        </a>
        
        <nav class="footer-nav">
          {#each navLinks as link}
            <a href={link.href} class="nav-link">{link.label}</a>
          {/each}
        </nav>
      </div>

      <div class="footer-bottom">
        <p class="tagline">
          Built on the <a href="https://favcrm.io" target="_blank" rel="noopener noreferrer" class="favcrm-link">FavCRM</a> Headless Commerce Engine.
        </p>
        <div class="meta">
          <span>&copy; {year} {brandName}.</span>
          <span class="desktop-only">All rights reserved.</span>
        </div>
      </div>

    </div>
  </div>
</footer>

<style>
  .site-footer {
    padding: clamp(60px, 10vw, 100px) 0 clamp(40px, 6vw, 60px);
    background: #ffffff;
    border-top: 1px solid var(--line, #e5e7eb);
  }

  .footer-content {
    display: flex;
    flex-direction: column;
    gap: clamp(48px, 8vw, 80px);
  }

  .footer-top {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
  }

  .footer-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    text-decoration: none;
    color: var(--ink, #111);
  }

  .brand-icon-wrapper {
    width: 48px;
    height: 48px;
    background: var(--ink, #111);
    color: white;
    border-radius: 12px;
    display: grid;
    place-items: center;
  }

  .brand-text {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 500;
    letter-spacing: -0.02em;
  }

  .footer-nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: clamp(16px, 4vw, 40px);
  }

  .nav-link {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--ink-soft, #2a2a2a);
    text-decoration: none;
    transition: color 200ms ease;
  }

  .nav-link:hover {
    color: var(--ink, #111);
  }

  .footer-bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding-top: 32px;
    border-top: 1px solid var(--line, #e5e7eb);
    text-align: center;
  }

  .tagline {
    margin: 0;
    font-size: 0.95rem;
    color: var(--muted, #6b6b6b);
    max-width: 400px;
    line-height: 1.5;
  }

  .favcrm-link {
    color: var(--ink, #111);
    font-weight: 600;
    text-decoration: none;
    position: relative;
  }
  
  .favcrm-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 1px;
    background: currentColor;
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 300ms ease;
  }

  .favcrm-link:hover::after {
    transform: scaleX(1);
    transform-origin: left;
  }

  .meta {
    font-size: 0.85rem;
    color: var(--muted, #6b6b6b);
    display: flex;
    gap: 4px;
  }

  .desktop-only { display: none; }

  @media (min-width: 768px) {
    .footer-top {
      flex-direction: row;
      justify-content: space-between;
    }

    .footer-brand {
      flex-direction: row;
    }

    .footer-bottom {
      flex-direction: row;
      justify-content: space-between;
      text-align: left;
    }

    .tagline {
      max-width: none;
    }

    .desktop-only { display: inline; }
  }
</style>