<script lang="ts">
  import { Search } from "lucide-svelte";
  import PageHeader from "$lib/components/site/PageHeader.svelte";
  import ProductCard from "$lib/components/site/ProductCard.svelte";
  import EmptyState from "$lib/components/site/EmptyState.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Shop - Catalog</title>
  <meta name="description" content="Browse our entire product catalog. Find the best items with live pricing and inventory." />
</svelte:head>

<PageHeader
  eyebrow="Shop"
  title="Catalog"
  lead="Every product published in your FavCRM workspace, with live pricing and inventory."
/>

<section class="site-container site-section site-section--tight">
  <form class="toolbar" method="GET">
    <label>
      <Search size={16} strokeWidth={1.6} />
      <input name="q" placeholder="Search products" value={data.search ?? ""} />
    </label>
    <select name="category" aria-label="Category">
      <option value="">All categories</option>
      {#each data.categories as category}
        <option
          value={category.slug}
          selected={data.category_slug === category.slug}
        >
          {category.name}
        </option>
      {/each}
    </select>
    <button class="btn-site btn-site--secondary" type="submit">Filter</button>
  </form>

  {#if data.products.length}
    <div class="product-grid">
      {#each data.products as product}
        <ProductCard {product} />
      {/each}
    </div>
  {:else}
    <EmptyState
      title="No matching products"
      description="Try clearing the search or selecting a different category."
    />
  {/if}
</section>
