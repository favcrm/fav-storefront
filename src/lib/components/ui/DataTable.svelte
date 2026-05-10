<script lang="ts">
	import type { Snippet } from 'svelte';
	import { clsx } from 'clsx';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className, children }: Props = $props();
</script>

<div class={clsx('overflow-x-auto', className)}>
	<table class="data-table w-full">
		{@render children()}
	</table>
</div>
