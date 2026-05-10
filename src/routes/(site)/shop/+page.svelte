<script lang="ts">
  import { PackageSearch, Search } from "lucide-svelte";
  import { formatMoney } from "$lib/format";
  import { productHref, productImage, productPrice } from "$lib/product";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<section class="page-shell">
  <div class="section-heading">
    <p class="eyebrow">Shop</p>
    <h1>Catalog</h1>
  </div>

  <form class="toolbar" method="GET">
    <label>
      <Search size={18} />
      <input name="q" placeholder="Search products" value={data.search ?? ""} />
    </label>
    <select name="category" aria-label="Category">
      <option value="">All categories</option>
      {#each data.categories as category}
        <option value={category.slug} selected={data.category_slug === category.slug}>
          {category.name}
        </option>
      {/each}
    </select>
    <button class="text-button" type="submit">Filter</button>
  </form>

  <div class="product-grid">
    {#each data.products as product}
      {@const image = productImage(product)}
      <a class="product-card" href={productHref(product)}>
        {#if image}
          <img src={image} alt={product.name} />
        {:else}
          <span class="image-fallback"><PackageSearch size={28} /></span>
        {/if}
        <strong>{product.name}</strong>
        <span>{formatMoney(productPrice(product))}</span>
      </a>
    {:else}
      <p class="empty-state">No matching products.</p>
    {/each}
  </div>
</section>
