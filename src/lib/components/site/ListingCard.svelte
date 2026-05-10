<script lang="ts">
  import type { Snippet } from "svelte";
  import type { PackageSearch } from "lucide-svelte";

  type IconComponent = typeof PackageSearch;

  let {
    icon: Icon,
    title,
    description = "",
    meta,
    price,
  }: {
    icon?: IconComponent;
    title: string;
    description?: string;
    meta?: Snippet;
    price?: string;
  } = $props();
</script>

<article class="listing-card">
  {#if Icon}
    <span class="listing-card-icon">
      <Icon size={18} strokeWidth={1.6} />
    </span>
  {/if}
  <h2 class="listing-title">{title}</h2>
  {#if description}
    <p>{description}</p>
  {/if}
  {#if meta || price}
    <div class="listing-meta">
      {#if meta}{@render meta()}{:else}<span></span>{/if}
      {#if price}<span class="listing-price">{price}</span>{/if}
    </div>
  {/if}
</article>
