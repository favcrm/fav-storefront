<script lang="ts">
  import type { PackageSearch } from "lucide-svelte";

  type IconComponent = typeof PackageSearch;

  let {
    href,
    icon: Icon,
    title,
    description,
  }: {
    href: string;
    icon: IconComponent;
    title: string;
    description: string;
  } = $props();
</script>

<a {href}>
  <span class="feature-icon">
    <Icon size={18} strokeWidth={1.6} />
  </span>
  <strong>{title}</strong>
  <p>{description}</p>
</a>
