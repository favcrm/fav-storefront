<script lang="ts">
  import IconMark from "./IconMark.svelte";

  let {
    brandName = "FavCRM Storefront",
  }: { brandName?: string } = $props();

  const year = new Date().getFullYear();

  const groups = [
    {
      title: "Shop",
      links: [
        { href: "/shop", label: "Catalog" },
        { href: "/bookings", label: "Bookings" },
        { href: "/events", label: "Events" },
      ],
    },
    {
      title: "Account",
      links: [
        { href: "/login", label: "Sign in" },
        { href: "/member", label: "Member portal" },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "/blog", label: "Journal" },
        { href: "/contact", label: "Contact" },
      ],
    },
  ];
</script>

<footer class="site-footer">
  <div class="site-container">
    <div class="site-footer-grid">
      <div>
        <a class="brand-lockup" href="/">
          <IconMark name={brandName} />
          <span>{brandName}</span>
        </a>
        <p class="site-footer-tagline">
          A storefront, bookings, events, and member portal — built on the
          FavCRM customer API.
        </p>
      </div>
      {#each groups as group}
        <div>
          <h4>{group.title}</h4>
          <ul>
            {#each group.links as link}
              <li><a href={link.href}>{link.label}</a></li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
    <div class="site-footer-meta">
      <span>© {year} {brandName}</span>
      <span>Powered by FavCRM headless commerce</span>
    </div>
  </div>
</footer>
