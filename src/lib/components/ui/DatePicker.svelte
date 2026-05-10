<script lang="ts">
	import { clsx } from 'clsx';

	interface Props {
		name: string;
		label?: string;
		value?: string;
		min?: string;
		max?: string;
		error?: string;
		required?: boolean;
		disabled?: boolean;
		class?: string;
	}

	let {
		name,
		label,
		value = $bindable(''),
		min,
		max,
		error,
		required = false,
		disabled = false,
		class: className
	}: Props = $props();
</script>

<div class={clsx('space-y-1', className)}>
	{#if label}
		<label for={name} class="form-label">{label}</label>
	{/if}
	<input
		id={name}
		{name}
		type="date"
		bind:value
		{min}
		{max}
		{required}
		{disabled}
		class={clsx('form-input', error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10')}
	/>
	{#if error}
		<p class="text-xs text-red-500 mt-1">{error}</p>
	{/if}
</div>
