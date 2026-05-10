<script lang="ts">
	import { clsx } from 'clsx';
	import { m } from '$lib/stores/language';
	import { isValidPhoneNumber, getExampleNumber, type CountryCode } from 'libphonenumber-js';
	import examples from 'libphonenumber-js/mobile/examples';

	interface Props {
		label?: string;
		name: string;
		value?: string;
		placeholder?: string;
		error?: string;
		hint?: string;
		required?: boolean;
		disabled?: boolean;
		class?: string;
	}

	let {
		label,
		name,
		value = $bindable(''),
		placeholder = '',
		error = '',
		hint = '',
		required = false,
		disabled = false,
		class: className = ''
	}: Props = $props();

	const countries: { code: string; label: string; flag: string; iso: CountryCode }[] = [
		{ code: '+852', label: 'Hong Kong', flag: '🇭🇰', iso: 'HK' },
		{ code: '+1', label: 'United States', flag: '🇺🇸', iso: 'US' },
		{ code: '+1', label: 'Canada', flag: '🇨🇦', iso: 'CA' },
		{ code: '+44', label: 'United Kingdom', flag: '🇬🇧', iso: 'GB' },
		{ code: '+61', label: 'Australia', flag: '🇦🇺', iso: 'AU' },
		{ code: '+65', label: 'Singapore', flag: '🇸🇬', iso: 'SG' },
		{ code: '+86', label: 'China', flag: '🇨🇳', iso: 'CN' },
		{ code: '+886', label: 'Taiwan', flag: '🇹🇼', iso: 'TW' },
		{ code: '+81', label: 'Japan', flag: '🇯🇵', iso: 'JP' },
		{ code: '+82', label: 'South Korea', flag: '🇰🇷', iso: 'KR' },
		{ code: '+60', label: 'Malaysia', flag: '🇲🇾', iso: 'MY' },
		{ code: '+64', label: 'New Zealand', flag: '🇳🇿', iso: 'NZ' },
		{ code: '+33', label: 'France', flag: '🇫🇷', iso: 'FR' },
		{ code: '+49', label: 'Germany', flag: '🇩🇪', iso: 'DE' },
		{ code: '+39', label: 'Italy', flag: '🇮🇹', iso: 'IT' },
		{ code: '+971', label: 'United Arab Emirates', flag: '🇦🇪', iso: 'AE' }
	];

	function getExample(iso: CountryCode): string {
		try {
			const num = getExampleNumber(iso, examples);
			return num ? num.formatNational() : '';
		} catch {
			return '';
		}
	}

	let isOpen = $state(false);
	let searchQuery = $state('');
	let containerRef = $state<HTMLElement | null>(null);
	let searchInputRef = $state<HTMLInputElement | null>(null);
	let touched = $state(false);

	let selectedCountry = $state(countries[0]);
	let localNumber = $state('');

	let isPhoneValid = $derived.by(() => {
		if (!localNumber.trim()) return null;
		const full = selectedCountry.code + localNumber.replace(/\s/g, '');
		try {
			return isValidPhoneNumber(full, selectedCountry.iso);
		} catch {
			return false;
		}
	});

	$effect(() => {
		const expectedValue = localNumber ? selectedCountry.code + localNumber.replace(/\s/g, '') : '';
		if (value !== expectedValue) {
			if (!value) {
				localNumber = '';
			} else {
				const matchingCode = countries.find(c => value.startsWith(c.code));
				if (matchingCode) {
					selectedCountry = matchingCode;
					localNumber = value.slice(matchingCode.code.length);
				} else {
					localNumber = value;
				}
			}
		}
	});

	function handleInput(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		const val = target.value.replace(/[^\d\s]/g, '');
		localNumber = val;
		if (val) {
			value = selectedCountry.code + val.replace(/\s/g, '');
		} else {
			value = '';
		}
	}

	function handleBlur() {
		touched = true;
	}

	let filteredCountries = $derived(
		countries.filter(
			(c) =>
				c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.code.includes(searchQuery)
		)
	);

	function toggleDropdown() {
		if (disabled) return;
		isOpen = !isOpen;
		if (isOpen) {
			searchQuery = '';
			// Use setTimeout to ensure DOM is updated before focusing
			setTimeout(() => {
				if (searchInputRef) searchInputRef.focus();
			}, 0);
		}
	}

	function selectCountry(country: typeof countries[0]) {
		selectedCountry = country;
		isOpen = false;
		if (localNumber) {
			value = selectedCountry.code + localNumber.replace(/\s/g, '');
		}
	}

	// Click outside to close
	function handleWindowClick(e: MouseEvent) {
		if (isOpen && containerRef && !containerRef.contains(e.target as Node)) {
			isOpen = false;
		}
	}
	
	// Close on Escape key
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			isOpen = false;
		}
	}
</script>

<svelte:window onmousedown={handleWindowClick} onkeydown={handleKeyDown} />

<div class={clsx('space-y-1', className)}>
	{#if label}
		<label for={name} class="form-label">
			{label}
			{#if required}
				<span class="text-red-500 ml-0.5">*</span>
			{/if}
		</label>
	{/if}

	<div class="flex relative" bind:this={containerRef}>
		<!-- Custom Dropdown Trigger -->
		<button
			type="button"
			onclick={toggleDropdown}
			{disabled}
			aria-haspopup="listbox"
			aria-expanded={isOpen}
			class={clsx(
				"flex items-center justify-between gap-2 px-3 py-3 bg-slate-50 border border-r-0 transition-colors rounded-none outline-none focus:ring-0 focus:bg-white z-10 min-w-[110px]",
				error ? 'border-red-500' : 'border-slate-200 hover:bg-slate-100',
				isOpen && 'bg-white border-green-700 border-r border-r-green-700 shadow-[inset_0_0_0_1px_rgba(34,120,80,1)]',
				disabled && 'opacity-50 cursor-not-allowed'
			)}
		>
			<span class="flex items-center gap-2">
				<span class="text-base leading-none">{selectedCountry.flag}</span>
				<span class="font-medium text-slate-700 tracking-wide">{selectedCountry.code}</span>
			</span>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class={clsx("text-slate-400 transition-transform duration-200 shrink-0", isOpen && "rotate-180")}><path d="m6 9 6 6 6-6"/></svg>
		</button>

		<!-- Dropdown Popover -->
		{#if isOpen}
			<div 
				class="absolute top-full left-0 mt-1 w-[280px] bg-white border border-slate-200 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 rounded-none"
				role="listbox"
			>
				<!-- Search Header -->
				<div class="p-2 border-b border-slate-100 bg-slate-50/50">
					<div class="relative">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
						<input
							bind:this={searchInputRef}
							type="text"
							bind:value={searchQuery}
							placeholder="Search countries..."
							class="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 focus:border-green-700 focus:ring-0 outline-none placeholder:text-slate-400 transition-colors rounded-none"
						/>
					</div>
				</div>

				<!-- Country List -->
				<ul class="max-h-[260px] overflow-y-auto overscroll-contain py-1">
					{#each filteredCountries as country}
						<li>
							<button
								type="button"
								onclick={() => selectCountry(country)}
								class={clsx(
									"w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors",
									selectedCountry.code === country.code && selectedCountry.label === country.label 
										? "bg-green-50/50 text-green-900" 
										: "hover:bg-slate-50 text-slate-700"
								)}
								role="option"
								aria-selected={selectedCountry.code === country.code}
							>
								<div class="flex items-center gap-3">
									<span class="text-base leading-none">{country.flag}</span>
									<div class="flex flex-col">
										<span class="text-sm font-medium">{country.label}</span>
										<span class="text-[10px] text-slate-400 font-mono">{getExample(country.iso)}</span>
									</div>
								</div>
								<span class="text-xs text-slate-500 font-mono tracking-tight">{country.code}</span>
							</button>
						</li>
					{:else}
						<li class="px-4 py-8 text-center text-sm text-slate-500">
							No countries found matching "{searchQuery}"
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Phone Number Input -->
		<div class="flex-1 min-w-0 relative">
			<input
				id={name}
				{name}
				type="tel"
				value={localNumber}
				oninput={handleInput}
				onblur={handleBlur}
				placeholder={getExample(selectedCountry.iso)}
				{required}
				{disabled}
				class={clsx(
					'w-full px-4 py-3 bg-slate-50 border focus:ring-0 focus:bg-white text-slate-900 font-medium transition-colors rounded-none',
					error || (touched && isPhoneValid === false) ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-green-700',
					isOpen && 'border-l-slate-200',
					isPhoneValid === true && 'border-green-500 focus:border-green-500'
				)}
			/>
			{#if isPhoneValid === true}
				<span class="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
				</span>
			{:else if touched && isPhoneValid === false}
				<span class="absolute right-3 top-1/2 -translate-y-1/2 text-red-400">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
				</span>
			{/if}
		</div>
	</div>

	{#if error}
		<span class="form-error">{error}</span>
	{:else if touched && isPhoneValid === false && localNumber.trim()}
		<span class="form-error">{m.validation_invalid_phone()}</span>
	{:else if hint}
		<span class="form-hint">{hint}</span>
	{/if}
</div>
