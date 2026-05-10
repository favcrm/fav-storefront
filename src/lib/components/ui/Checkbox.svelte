<script lang="ts">
	import { clsx } from 'clsx';

	interface Props {
		name: string;
		label?: string;
		checked?: boolean;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		class?: string;
	}

	let {
		name,
		label,
		checked = $bindable(false),
		required = false,
		disabled = false,
		error,
		class: className
	}: Props = $props();
</script>

<div class={clsx('space-y-1', className)}>
	<label for={name} class="flex items-start gap-3 cursor-pointer select-none group">
		<input
			id={name}
			{name}
			type="checkbox"
			bind:checked
			aria-required={required}
			aria-invalid={error ? 'true' : undefined}
			{disabled}
			class={clsx(
				'mt-0.5 h-5 w-5 rounded-none border-2 text-green-700 focus:ring-0 focus:ring-offset-0 transition-colors cursor-pointer',
				error ? 'border-red-500' : 'border-slate-300 group-hover:border-slate-400'
			)}
		/>
		{#if label}
			<span class="text-sm text-slate-700 leading-relaxed">
				{label}
				{#if required}
					<span class="text-red-500 ml-0.5">*</span>
				{/if}
			</span>
		{/if}
	</label>
	{#if error}
		<p class="text-xs text-red-500 ml-8">{error}</p>
	{/if}
</div>
