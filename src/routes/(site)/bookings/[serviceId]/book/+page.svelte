<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    ArrowLeft,
    CalendarDays,
    Check,
    Clock,
    LogIn,
    ShieldCheck,
  } from "lucide-svelte";
  import type {
    BookingConfig,
    StaffMember,
    TimeSlot,
  } from "@favcrm/sdk";
  import { authStore } from "$lib/stores/auth";
  import { createFavCRM } from "$lib/favcrm";
  import { toasts } from "$lib/stores/toast";
  import { formatMoney } from "$lib/format";
  import Button from "$lib/components/site/Button.svelte";
  import Eyebrow from "$lib/components/site/Eyebrow.svelte";
  import Field from "$lib/components/site/Field.svelte";
  import type { PageData } from "./$types";

  const MIN_ADVANCE_MIN = 60;

  let { data }: { data: PageData } = $props();

  const service = $derived(data.service);

  let mounted = $state(false);
  let staffList = $state<StaffMember[]>([]);
  let selectedStaffId = $state<string | null>(null);
  let selectedAddonIds = $state<Set<string>>(new Set());
  let selectedDate = $state(todayIso());
  let slots = $state<TimeSlot[]>([]);
  let loadingSlots = $state(false);
  let slotsError = $state<string | null>(null);
  let selectedSlot = $state<TimeSlot | null>(null);
  let bookingConfig = $state<BookingConfig | null>(null);
  let notes = $state("");
  let submitting = $state(false);
  let submitError = $state<string | null>(null);

  const requiresLogin = $derived(service.requireLogin);
  const isAuthed = $derived(!!$authStore.jwt);
  const blockedByLogin = $derived(requiresLogin && !isAuthed);

  const basePrice = $derived(Number(service.price) || 0);
  const slotPrice = $derived(
    selectedSlot?.tierPrice
      ? Number(selectedSlot.tierPrice)
      : selectedSlot?.basePrice
        ? Number(selectedSlot.basePrice)
        : basePrice,
  );
  const addonTotal = $derived(
    (service.addons ?? [])
      .filter((a) => selectedAddonIds.has(a.id))
      .reduce((sum, a) => sum + (Number(a.price) || 0), 0),
  );
  const total = $derived(slotPrice + addonTotal);

  const maxAdvanceDays = $derived(
    bookingConfig?.advanceBookingDays ?? service.advanceBookingDays ?? 30,
  );
  const dateStrip = $derived(buildDateStrip(maxAdvanceDays));

  const limitReached = $derived(
    bookingConfig != null &&
      ((bookingConfig.dailyBookingCount != null &&
        bookingConfig.currentDailyUsage >= bookingConfig.dailyBookingCount) ||
        (bookingConfig.weeklyBookingCount != null &&
          bookingConfig.currentWeeklyUsage >=
            bookingConfig.weeklyBookingCount)),
  );

  const tooSoonStarts = $derived.by(() => {
    const set = new Set<string>();
    if (selectedDate !== todayIso()) return set;
    const now = new Date();
    const cutoff =
      now.getHours() * 60 + now.getMinutes() + MIN_ADVANCE_MIN;
    for (const slot of slots) {
      const [h, m] = slot.startTime.split(":").map(Number);
      if (h * 60 + m < cutoff) set.add(slot.startTime);
    }
    return set;
  });

  const canSubmit = $derived(
    !!selectedSlot &&
      !blockedByLogin &&
      !limitReached &&
      !submitting &&
      (!service.requiresStaff || selectedStaffId != null),
  );

  function todayIso(): string {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  function pad2(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }
  function buildDateStrip(days: number): {
    iso: string;
    weekday: string;
    day: string;
    month: string;
  }[] {
    const out = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const cap = Math.max(1, Math.min(days, 30));
    for (let i = 0; i < cap; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      out.push({
        iso: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
        weekday: d.toLocaleDateString("en", { weekday: "short" }),
        day: pad2(d.getDate()),
        month: d.toLocaleDateString("en", { month: "short" }),
      });
    }
    return out;
  }
  function formatTime(value: string): string {
    const [h, m] = value.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return date.toLocaleTimeString("en", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  function formatDateLong(iso: string): string {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString("en", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  async function loadStaff() {
    try {
      staffList = await createFavCRM().bookings.getStaff(service.id);
    } catch {
      staffList = [];
    }
  }

  async function loadSlots(iso: string) {
    if (!iso) return;
    loadingSlots = true;
    slotsError = null;
    selectedSlot = null;
    try {
      const sdk = createFavCRM();
      if ($authStore.jwt) sdk.setToken($authStore.jwt);
      const memberUuid = $authStore.memberUuid;
      const result = await sdk.bookings.getTimeSlots(service.id, {
        date: iso,
        ...(memberUuid
          ? { createQuotes: true, accountId: memberUuid }
          : {}),
        ...(selectedStaffId ? { staffId: selectedStaffId } : {}),
      });
      slots = result.slots;
      bookingConfig = result.bookingConfig ?? null;
    } catch (err) {
      slotsError = err instanceof Error ? err.message : "Unable to load slots";
      slots = [];
    } finally {
      loadingSlots = false;
    }
  }

  function toggleAddon(id: string) {
    const next = new Set(selectedAddonIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectedAddonIds = next;
  }

  async function submit() {
    if (!selectedSlot || !canSubmit) return;
    submitting = true;
    submitError = null;
    try {
      const sdk = createFavCRM();
      if ($authStore.jwt) sdk.setToken($authStore.jwt);

      const payload = {
        serviceId: service.id,
        bookingDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        ...(selectedSlot.scheduleId
          ? { scheduleId: selectedSlot.scheduleId }
          : {}),
        ...(selectedSlot.quoteId ? { quoteId: selectedSlot.quoteId } : {}),
        ...(selectedStaffId ? { staffId: selectedStaffId } : {}),
        ...(selectedAddonIds.size > 0
          ? { addonIds: [...selectedAddonIds] }
          : {}),
        ...(notes ? { notes } : {}),
      };

      const booking = isAuthed
        ? await sdk.bookings.create(payload)
        : await sdk.bookings.createGuest(payload);

      if (service.paymentRequired && isAuthed) {
        goto(`/bookings/${service.id}/book/${booking.id}/pay`);
        return;
      }

      toasts.success("Booking confirmed");
      goto(`/bookings/${service.id}/book/${booking.id}`);
    } catch (err) {
      submitError =
        err instanceof Error ? err.message : "Unable to create booking";
    } finally {
      submitting = false;
    }
  }

  onMount(() => {
    mounted = true;
    loadStaff();
  });

  $effect(() => {
    if (!mounted) return;
    if (selectedDate) loadSlots(selectedDate);
  });
</script>

<section class="site-container booking-flow">
  <a class="back-link" href="/bookings/{service.id}">
    <ArrowLeft size={14} strokeWidth={1.7} />
    Back to service
  </a>

  <header class="booking-header">
    <Eyebrow>Reserve</Eyebrow>
    <h1 class="site-h1">{service.name}</h1>
    <p class="site-lead">
      Choose a date and time. Slots reflect live availability from FavCRM.
    </p>
  </header>

  {#if blockedByLogin}
    <div class="booking-gate">
      <span class="booking-gate-mark">
        <LogIn size={20} strokeWidth={1.6} />
      </span>
      <h2>Members only</h2>
      <p>Sign in with your phone number to reserve this service.</p>
      <Button
        href="/login?next=/bookings/{service.id}/book"
        size="lg"
      >
        Sign in to continue
      </Button>
    </div>
  {:else}
    <div class="booking-grid">
      <div class="booking-form">
        <div class="booking-block">
          <Eyebrow>Date</Eyebrow>
          <div class="date-strip" role="radiogroup" aria-label="Select date">
            {#each dateStrip as day (day.iso)}
              <button
                type="button"
                role="radio"
                aria-checked={selectedDate === day.iso}
                class="date-chip"
                class:is-active={selectedDate === day.iso}
                onclick={() => (selectedDate = day.iso)}
              >
                <span class="date-chip-weekday">{day.weekday}</span>
                <span class="date-chip-day">{day.day}</span>
                <span class="date-chip-month">{day.month}</span>
              </button>
            {/each}
          </div>
        </div>

        {#if staffList.length > 0}
          <div class="booking-block">
            <Eyebrow>
              Specialist
              {#if !service.requiresStaff}
                <span class="optional-tag">optional</span>
              {/if}
            </Eyebrow>
            <div class="staff-grid">
              {#if !service.requiresStaff}
                <button
                  type="button"
                  class="staff-chip"
                  class:is-active={selectedStaffId === null}
                  onclick={() => (selectedStaffId = null)}
                >
                  <span class="staff-avatar staff-avatar--any">?</span>
                  <span class="staff-name">Any available</span>
                </button>
              {/if}
              {#each staffList as staff (staff.memberId)}
                <button
                  type="button"
                  class="staff-chip"
                  class:is-active={selectedStaffId === staff.memberId}
                  onclick={() => (selectedStaffId = staff.memberId)}
                >
                  <span class="staff-avatar">
                    {staff.memberName
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <span class="staff-name">{staff.memberName}</span>
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <div class="booking-block">
          <Eyebrow>Time</Eyebrow>
          {#if loadingSlots}
            <div class="slot-grid">
              {#each Array(8) as _}
                <span class="slot-chip slot-chip--skeleton" aria-hidden="true">
                  <span class="skeleton-line"></span>
                  <span class="skeleton-line skeleton-line--sm"></span>
                </span>
              {/each}
            </div>
          {:else if slotsError}
            <p class="form-note form-note--warn">{slotsError}</p>
          {:else if slots.length === 0}
            <p class="form-note">No slots available on this date.</p>
          {:else}
            {#if bookingConfig?.dailyBookingCount != null}
              {@const remaining =
                bookingConfig.dailyBookingCount -
                bookingConfig.currentDailyUsage}
              {#if remaining <= 0}
                <p class="form-note form-note--warn">
                  Daily limit reached ({bookingConfig.dailyBookingCount}).
                </p>
              {:else if remaining <= 2}
                <p class="form-note">
                  {remaining} booking{remaining === 1 ? "" : "s"} remaining today.
                </p>
              {/if}
            {/if}
            <div class="slot-grid">
              {#each slots as slot (slot.startTime)}
                {@const tooSoon = tooSoonStarts.has(slot.startTime)}
                {@const disabled = !slot.available || tooSoon}
                <button
                  type="button"
                  class="slot-chip"
                  class:is-active={selectedSlot?.startTime === slot.startTime}
                  class:is-disabled={disabled}
                  disabled={disabled}
                  onclick={() => (selectedSlot = slot)}
                >
                  <span class="slot-time">{formatTime(slot.startTime)}</span>
                  <span class="slot-end">{formatTime(slot.endTime)}</span>
                  {#if slot.tierPrice && slot.tierPrice !== slot.basePrice}
                    <span class="slot-price slot-price--tier">
                      {formatMoney(Number(slot.tierPrice))}
                    </span>
                  {/if}
                  {#if !slot.available}
                    <span class="slot-flag">Full</span>
                  {/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        {#if service.addons && service.addons.length > 0 && selectedSlot}
          <div class="booking-block">
            <Eyebrow>
              Add-ons<span class="optional-tag">optional</span>
            </Eyebrow>
            <div class="addon-list">
              {#each service.addons as addon (addon.id)}
                {@const checked = selectedAddonIds.has(addon.id)}
                <button
                  type="button"
                  class="addon-row"
                  class:is-active={checked}
                  onclick={() => toggleAddon(addon.id)}
                >
                  <span class="addon-check" aria-hidden="true">
                    {#if checked}
                      <Check size={12} strokeWidth={2.4} />
                    {/if}
                  </span>
                  <span class="addon-body">
                    <span class="addon-name">{addon.name}</span>
                    {#if addon.description}
                      <span class="addon-description">
                        {addon.description}
                      </span>
                    {/if}
                  </span>
                  <span class="addon-price">
                    +{formatMoney(Number(addon.price) || 0)}
                  </span>
                </button>
              {/each}
            </div>
          </div>
        {/if}

        {#if selectedSlot}
          <div class="booking-block">
            <Field
              label="Notes (optional)"
              name="notes"
              type="textarea"
              placeholder="Anything we should know?"
              rows={3}
              bind:value={notes}
            />
          </div>
        {/if}
      </div>

      <aside class="booking-summary">
        <Eyebrow>Summary</Eyebrow>
        <h2 class="booking-summary-title">{service.name}</h2>
        <dl class="booking-summary-rows">
          <div>
            <dt>Date</dt>
            <dd>{formatDateLong(selectedDate)}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>
              {#if selectedSlot}
                {formatTime(selectedSlot.startTime)} – {formatTime(
                  selectedSlot.endTime,
                )}
              {:else}
                <span class="placeholder">Not selected</span>
              {/if}
            </dd>
          </div>
          {#if selectedStaffId}
            <div>
              <dt>Specialist</dt>
              <dd>
                {staffList.find((s) => s.memberId === selectedStaffId)
                  ?.memberName ?? "Selected"}
              </dd>
            </div>
          {/if}
          <div>
            <dt>Duration</dt>
            <dd>
              <Clock size={12} strokeWidth={1.6} />
              {service.durationMinutes} min
            </dd>
          </div>
        </dl>

        {#if selectedAddonIds.size > 0}
          <ul class="booking-summary-addons">
            {#each (service.addons ?? []).filter((a) => selectedAddonIds.has(a.id)) as addon (addon.id)}
              <li>
                <span>{addon.name}</span>
                <span>+{formatMoney(Number(addon.price) || 0)}</span>
              </li>
            {/each}
          </ul>
        {/if}

        <div class="booking-summary-total">
          <span>Total</span>
          <span class="booking-summary-amount">{formatMoney(total)}</span>
        </div>

        {#if submitError}
          <p class="form-note form-note--warn">{submitError}</p>
        {/if}

        <Button
          size="lg"
          disabled={!canSubmit}
          onclick={submit}
        >
          <CalendarDays size={16} strokeWidth={1.8} />
          {service.paymentRequired ? "Continue to payment" : "Confirm booking"}
        </Button>

        <p class="booking-summary-fineprint">
          <ShieldCheck size={12} strokeWidth={1.6} />
          {service.requiresConfirmation
            ? "Booking will be confirmed after review."
            : "Instant confirmation."}
        </p>
      </aside>
    </div>
  {/if}
</section>

<style>
  .booking-flow {
    padding-top: clamp(20px, 3vw, 36px);
    padding-bottom: clamp(40px, 5vw, 72px);
  }
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted, #6b6b6b);
    margin-bottom: clamp(16px, 2vw, 28px);
  }
  .back-link:hover {
    color: var(--ink, #111);
  }
  .booking-header {
    margin-bottom: clamp(24px, 3vw, 40px);
  }
  .booking-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
    gap: clamp(24px, 3vw, 40px);
    align-items: start;
  }
  @media (max-width: 900px) {
    .booking-grid {
      grid-template-columns: 1fr;
    }
  }
  .booking-form {
    display: grid;
    gap: clamp(20px, 2.4vw, 32px);
  }
  .booking-block {
    display: grid;
    gap: 12px;
  }
  .optional-tag {
    margin-left: 6px;
    font-size: 10px;
    letter-spacing: 0.06em;
    color: var(--muted, #6b6b6b);
    text-transform: lowercase;
  }
  .date-strip {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }
  .date-chip {
    display: grid;
    gap: 2px;
    place-items: center;
    min-width: 64px;
    padding: 10px 12px;
    border: 1px solid var(--line, #e5e7eb);
    border-radius: 10px;
    background: var(--surface, #fff);
    color: var(--ink, #111);
    cursor: pointer;
    scroll-snap-align: start;
    transition: border-color 120ms, background 120ms, color 120ms;
  }
  .date-chip:hover {
    border-color: var(--ink, #111);
  }
  .date-chip.is-active {
    background: var(--ink, #111);
    color: var(--paper, #ffffff);
    border-color: var(--ink, #111);
  }
  .date-chip-weekday {
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted, #6b6b6b);
  }
  .date-chip.is-active .date-chip-weekday,
  .date-chip.is-active .date-chip-month {
    color: rgba(255, 255, 255, 0.7);
  }
  .date-chip-day {
    font-family: var(--font-display);
    font-size: 1.25rem;
    line-height: 1;
  }
  .date-chip-month {
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted, #6b6b6b);
  }
  .staff-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }
  .staff-chip {
    display: grid;
    place-items: center;
    gap: 6px;
    padding: 14px 10px;
    border: 1px solid var(--line, #e5e7eb);
    border-radius: 10px;
    background: var(--surface, #fff);
    color: var(--ink, #111);
    cursor: pointer;
    transition: border-color 120ms;
  }
  .staff-chip:hover {
    border-color: var(--ink, #111);
  }
  .staff-chip.is-active {
    border-color: var(--accent, #1e3a8a);
    box-shadow: inset 0 0 0 1px var(--accent, #1e3a8a);
  }
  .staff-avatar {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: var(--accent-soft, #eef2ff);
    color: var(--accent, #1e3a8a);
    font-weight: 600;
    font-size: 13px;
  }
  .staff-avatar--any {
    background: #f3f4f6;
    color: var(--muted, #6b6b6b);
  }
  .staff-name {
    font-size: 13px;
    font-weight: 500;
  }
  .slot-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
  }
  .slot-chip {
    position: relative;
    display: grid;
    gap: 2px;
    padding: 12px 8px;
    border: 1px solid var(--line, #e5e7eb);
    border-radius: 8px;
    background: var(--surface, #fff);
    color: var(--ink, #111);
    cursor: pointer;
    transition: border-color 120ms, background 120ms, color 120ms;
  }
  .slot-chip:hover:not(:disabled) {
    border-color: var(--ink, #111);
  }
  .slot-chip.is-active {
    background: var(--ink, #111);
    color: var(--paper, #ffffff);
    border-color: var(--ink, #111);
  }
  .slot-chip.is-disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .slot-chip--skeleton {
    height: 60px;
    background: #f3f4f6;
    pointer-events: none;
  }
  .skeleton-line {
    display: block;
    height: 8px;
    width: 60%;
    background: rgba(0, 0, 0, 0.08);
    border-radius: 4px;
    margin: 4px auto;
  }
  .skeleton-line--sm {
    width: 40%;
  }
  .slot-time {
    font-size: 14px;
    font-weight: 500;
  }
  .slot-end {
    font-size: 11px;
    color: var(--muted, #6b6b6b);
  }
  .slot-chip.is-active .slot-end {
    color: rgba(255, 255, 255, 0.7);
  }
  .slot-price {
    font-size: 11px;
    margin-top: 2px;
    font-variant-numeric: tabular-nums;
  }
  .slot-price--tier {
    color: var(--accent, #1e3a8a);
    font-weight: 600;
  }
  .slot-chip.is-active .slot-price--tier {
    color: #c7d2fe;
  }
  .slot-flag {
    margin-top: 2px;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #b91c1c;
  }
  .addon-list {
    display: grid;
    gap: 8px;
  }
  .addon-row {
    display: grid;
    grid-template-columns: 20px 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 12px 14px;
    border: 1px solid var(--line, #e5e7eb);
    border-radius: 10px;
    background: var(--surface, #fff);
    text-align: left;
    cursor: pointer;
    transition: border-color 120ms;
  }
  .addon-row:hover {
    border-color: var(--ink, #111);
  }
  .addon-row.is-active {
    border-color: var(--accent, #1e3a8a);
    box-shadow: inset 0 0 0 1px var(--accent, #1e3a8a);
  }
  .addon-check {
    width: 18px;
    height: 18px;
    display: grid;
    place-items: center;
    border: 1.5px solid var(--line, #e5e7eb);
    border-radius: 4px;
    color: var(--paper, #fff);
  }
  .addon-row.is-active .addon-check {
    background: var(--accent, #1e3a8a);
    border-color: var(--accent, #1e3a8a);
  }
  .addon-body {
    display: grid;
    gap: 2px;
  }
  .addon-name {
    font-size: 14px;
    font-weight: 500;
  }
  .addon-description {
    font-size: 12px;
    color: var(--muted, #6b6b6b);
  }
  .addon-price {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 13px;
    color: var(--ink, #111);
  }
  .booking-summary {
    position: sticky;
    top: calc(var(--header-height, 64px) + 16px);
    display: grid;
    gap: 14px;
    padding: clamp(20px, 2vw, 28px);
    background: var(--ink, #111);
    color: var(--paper, #ffffff);
    border-radius: var(--radius-card, 10px);
  }
  .booking-summary :global(.eyebrow) {
    color: rgba(255, 255, 255, 0.7);
  }
  .booking-summary-title {
    font-family: var(--font-display);
    font-size: 1.5rem;
    margin: 0;
    line-height: 1.2;
  }
  .booking-summary-rows {
    display: grid;
    gap: 10px;
    margin: 4px 0 0;
    padding: 14px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }
  .booking-summary-rows div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    font-size: 13px;
  }
  .booking-summary-rows dt {
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 11px;
  }
  .booking-summary-rows dd {
    margin: 0;
    text-align: right;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .booking-summary-rows dd .placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  .booking-summary-addons {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 6px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
  }
  .booking-summary-addons li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-variant-numeric: tabular-nums;
  }
  .booking-summary-total {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: 4px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.7);
  }
  .booking-summary-amount {
    font-family: var(--font-display);
    font-size: 1.75rem;
    color: var(--paper, #ffffff);
    letter-spacing: -0.01em;
    text-transform: none;
  }
  .booking-summary-fineprint {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
  }
  .booking-gate {
    display: grid;
    place-items: center;
    gap: 12px;
    padding: clamp(32px, 4vw, 56px);
    background: var(--surface, #fff);
    border: 1px solid var(--line, #e5e7eb);
    border-radius: var(--radius-card, 10px);
    text-align: center;
  }
  .booking-gate-mark {
    width: 56px;
    height: 56px;
    display: grid;
    place-items: center;
    background: var(--accent-soft, #eef2ff);
    color: var(--accent, #1e3a8a);
    border-radius: 999px;
  }
  .booking-gate h2 {
    font-family: var(--font-display);
    font-size: 1.5rem;
    margin: 0;
  }
  .booking-gate p {
    margin: 0;
    color: var(--muted, #6b6b6b);
  }
</style>
