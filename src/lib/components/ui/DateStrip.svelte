<script lang="ts">
	import { clsx } from 'clsx';
	import { ChevronRight } from 'lucide-svelte';

	interface Props {
		value: string; // YYYY-MM-DD
		daysToGenerate?: number; // How many days ahead to show
		startDate?: Date; // Defaults to today
	}

	let { 
		value = $bindable(), 
		daysToGenerate = 30, 
		startDate = new Date() 
	}: Props = $props();

	// Format helper for YYYY-MM-DD
	function formatToDateString(d: Date): string {
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	// Generate array of date objects
	let dateList = $derived.by(() => {
		const list = [];
		const start = new Date(startDate);
		// Strip time for clean comparison
		start.setHours(0, 0, 0, 0);

		for (let i = 0; i < daysToGenerate; i++) {
			const d = new Date(start);
			d.setDate(start.getDate() + i);
			
			list.push({
				date: d,
				dateStr: formatToDateString(d),
				dayOfWeek: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d),
				dayNumber: d.getDate(),
				month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d)
			});
		}
		return list;
	});

	// If no value is selected initially, you might want to default to the first available, 
	// but we'll let the parent component handle that to keep this pure.
	function selectDate(dateStr: string) {
		value = dateStr;
	}
</script>

<div class="relative w-full">
	<!-- Gradient fade to hint at scrollability -->
	<div class="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 hidden sm:block"></div>

	<div 
		class="flex gap-2 sm:gap-3 overflow-x-auto pb-4 pt-1 snap-x mandatory" 
		style="scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;"
	>
		{#each dateList as item}
			{@const isSelected = value === item.dateStr}
			<button
				type="button"
				onclick={() => selectDate(item.dateStr)}
				class={clsx(
					"relative flex-shrink-0 w-[72px] sm:w-[84px] h-[90px] sm:h-[100px] flex flex-col items-center justify-center transition-all rounded-none outline-none snap-start group",
					"focus:ring-2 focus:ring-green-700 focus:ring-offset-2",
					isSelected 
						? "bg-[#1a3a2a] text-white border border-[#1a3a2a] shadow-lg shadow-slate-900/10 z-10" 
						: "bg-white text-slate-900 border border-slate-200 hover:border-green-500 hover:bg-slate-50 z-0"
				)}
			>
				<span class={clsx(
					"text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-1",
					isSelected ? "text-green-400" : "text-slate-500 group-hover:text-green-700"
				)}>
					{item.dayOfWeek}
				</span>
				
				<span class={clsx(
					"font-serif text-2xl sm:text-3xl font-medium leading-none",
					isSelected ? "text-white" : "text-slate-900"
				)}>
					{item.dayNumber}
				</span>
				
				<span class={clsx(
					"text-[10px] sm:text-xs font-semibold uppercase tracking-widest mt-1.5",
					isSelected ? "text-white/70" : "text-slate-400"
				)}>
					{item.month}
				</span>

				{#if isSelected}
					<span class="absolute -bottom-1 w-1 h-1 bg-green-500"></span>
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	/* Hide scrollbar for Chrome, Safari and Opera */
	div::-webkit-scrollbar {
		display: none;
	}
	/* Hide scrollbar for IE, Edge and Firefox */
	div {
		-ms-overflow-style: none;  /* IE and Edge */
		scrollbar-width: none;  /* Firefox */
	}
</style>
