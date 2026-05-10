<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  onMount(() => {
    goto("/admin/rewards/earning-rules", { replaceState: true });
  });
</script>
