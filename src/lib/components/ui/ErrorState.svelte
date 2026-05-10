<script lang="ts">
	import { m } from '$lib/stores/language';
	import { AlertCircle } from 'lucide-svelte';

	interface Props {
		message?: string;
		onRetry?: () => void;
	}

	let { message = '', onRetry }: Props = $props();
</script>

<div class="empty-state">
	<div class="empty-state-icon">
		<AlertCircle class="w-full h-full text-red-400" />
	</div>
	<h3 class="empty-state-title text-red-700">{message || m.common_error()}</h3>
	{#if onRetry}
		<button
			onclick={onRetry}
			class="btn-primary mt-4"
		>
			{m.common_retry()}
		</button>
	{/if}
</div>
