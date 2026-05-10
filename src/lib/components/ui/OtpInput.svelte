<script lang="ts">
  import { clsx } from "clsx";

  interface Props {
    label?: string;
    name?: string;
    value?: string;
    length?: number;
    error?: string;
    required?: boolean;
    disabled?: boolean;
  }

  let {
    label,
    name = "otp",
    value = $bindable(""),
    length = 6,
    error = "",
    required = false,
    disabled = false,
  }: Props = $props();

  let digits = $state<string[]>(Array(length).fill(""));
  let inputRefs = $state<HTMLInputElement[]>([]);

  // Sync from outside value -> digits (e.g. parent resetting the form)
  $effect(() => {
    const currentDigits = digits.join("");
    if (value !== currentDigits) {
      if (!value) {
        digits = Array(length).fill("");
      } else {
        const valArr = value.split("").slice(0, length);
        digits = [...valArr, ...Array(length - valArr.length).fill("")];
      }
    }
  });

  function handleInput(index: number, event: Event) {
    const target = event.target as HTMLInputElement;
    const val = target.value.replace(/[^0-9]/g, "");

    if (val) {
      digits[index] = val.slice(-1);
      if (index < length - 1) {
        inputRefs[index + 1]?.focus();
      }
    } else {
      digits[index] = "";
    }
    value = digits.join("");
  }

  function handleKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === "Backspace") {
      if (!digits[index] && index > 0) {
        event.preventDefault();
        digits[index - 1] = "";
        inputRefs[index - 1]?.focus();
        value = digits.join("");
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      inputRefs[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData =
      event.clipboardData?.getData("text").replace(/[^0-9]/g, "").slice(0, length) ||
      "";

    if (pastedData) {
      const newDigits = [...digits];
      for (let i = 0; i < pastedData.length; i++) {
        if (i < length) {
          newDigits[i] = pastedData[i];
        }
      }
      digits = newDigits;

      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs[focusIndex]?.focus();
      value = digits.join("");
    }
  }
</script>

<div class="space-y-3 w-full">
  {#if label}
    <label for={name} class="form-label block">
      {label}
      {#if required}
        <span class="text-red-500 ml-0.5">*</span>
      {/if}
    </label>
  {/if}

  <div class="flex items-center gap-2 sm:gap-3 w-full justify-between" dir="ltr">
    {#each Array(length) as _, i}
      <input
        bind:this={inputRefs[i]}
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        maxlength="1"
        value={digits[i]}
        {disabled}
        oninput={(e) => handleInput(i, e)}
        onkeydown={(e) => handleKeyDown(i, e)}
        onpaste={handlePaste}
        class={clsx(
          "w-full aspect-[4/5] text-center text-2xl font-mono font-semibold bg-white border transition-all rounded-none outline-none focus:ring-0",
          error
            ? "border-red-500 focus:border-red-500 shadow-[inset_0_0_0_1px_rgba(239,68,68,1)] text-red-600"
            : digits[i]
              ? "border-slate-800 text-slate-900 shadow-[inset_0_0_0_1px_rgba(30,41,59,1)]"
              : "border-slate-200 focus:border-green-700 focus:shadow-[inset_0_0_0_1px_rgba(34,120,80,1)] text-slate-900",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50"
        )}
        aria-label={`Digit ${i + 1}`}
      />
    {/each}
  </div>

  {#if error}
    <p class="text-sm font-medium text-red-600 bg-red-50 p-3 border-l-2 border-red-600">
      {error}
    </p>
  {/if}

  <!-- Hidden input for form submission if needed -->
  <input type="hidden" id={name} {name} {value} {required} />
</div>