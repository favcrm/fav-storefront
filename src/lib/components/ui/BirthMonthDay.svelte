<script lang="ts">
	import { clsx } from 'clsx';
	import { untrack } from 'svelte';

	interface Props {
		name: string;
		label?: string;
		value?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		class?: string;
	}

	let {
		name,
		label,
		value = $bindable(''),
		required = false,
		disabled = false,
		error,
		class: className
	}: Props = $props();

	const months = [
		{ value: '01', label: 'January' },
		{ value: '02', label: 'February' },
		{ value: '03', label: 'March' },
		{ value: '04', label: 'April' },
		{ value: '05', label: 'May' },
		{ value: '06', label: 'June' },
		{ value: '07', label: 'July' },
		{ value: '08', label: 'August' },
		{ value: '09', label: 'September' },
		{ value: '10', label: 'October' },
		{ value: '11', label: 'November' },
		{ value: '12', label: 'December' },
	];

	let selectedMonth = $state('');
	let selectedDay = $state('');

	// Sync from external value changes (e.g. initial value)
	$effect(() => {
		if (value && value.includes('-')) {
			const [mon, day] = value.split('-');
			const curMonth = untrack(() => selectedMonth);
			const curDay = untrack(() => selectedDay);
			if (mon !== curMonth) selectedMonth = mon;
			if (day !== curDay) selectedDay = day;
		}
	});

	let daysInMonth = $derived.by(() => {
		if (!selectedMonth) return 31;
		const month = parseInt(selectedMonth, 10);
		if ([4, 6, 9, 11].includes(month)) return 30;
		if (month === 2) return 29;
		return 31;
	});

	let dayOptions = $derived(
		Array.from({ length: daysInMonth }, (_, i) => {
			const d = String(i + 1).padStart(2, '0');
			return { value: d, label: d };
		})
	);

	function updateValue() {
		if (selectedMonth && selectedDay) {
			value = `${selectedMonth}-${selectedDay}`;
		} else {
			value = '';
		}
	}
</script>

<div class={clsx('space-y-1', className)}>
	{#if label}
		<label for={name} class="form-label">
			{label}
			{#if required}
				<span class="text-red-500 ml-0.5">*</span>
			{/if}
		</label>
	{/if}

	<div class="flex gap-3">
		<select
			id={name}
			{disabled}
			bind:value={selectedMonth}
			onchange={updateValue}
			class={clsx('form-input flex-1', error && 'border-red-500 focus:border-red-500')}
		>
			<option value="" disabled>Month</option>
			{#each months as month (month.value)}
				<option value={month.value}>{month.label}</option>
			{/each}
		</select>

		<select
			{disabled}
			bind:value={selectedDay}
			onchange={updateValue}
			class={clsx('form-input w-24', error && 'border-red-500 focus:border-red-500')}
		>
			<option value="" disabled>Day</option>
			{#each dayOptions as day (day.value)}
				<option value={day.value}>{day.label}</option>
			{/each}
		</select>
	</div>

	{#if error}
		<p class="text-xs text-red-500 mt-1">{error}</p>
	{/if}
</div>
