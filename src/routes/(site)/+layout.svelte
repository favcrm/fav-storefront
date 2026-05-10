<script lang="ts">
  import SiteHeader from "$lib/components/site/SiteHeader.svelte";
  import SiteFooter from "$lib/components/site/SiteFooter.svelte";
  import ToastViewport from "$lib/components/site/ToastViewport.svelte";
  import type { Snippet } from "svelte";
  import type { LayoutData } from "./$types";

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  const brandName = $derived(data.tenant?.brandName ?? "FavCRM Storefront");
  const brandLogoUrl = $derived(data.tenant?.brandLogoUrl ?? null);
</script>

<svelte:head>
  <title>{brandName}</title>
  <meta
    name="description"
    content="A production-ready FavCRM headless storefront template."
  />
</svelte:head>

<div class="site">
  <SiteHeader {brandName} {brandLogoUrl} />
  <main>
    {@render children()}
  </main>
  <SiteFooter {brandName} />
  <ToastViewport />
</div>
