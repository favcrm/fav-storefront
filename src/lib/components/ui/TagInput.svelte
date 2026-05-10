<script lang="ts">
  import { X } from "lucide-svelte";

  interface Props {
    name: string;
    label?: string;
    values?: string[];
    placeholder?: string;
    error?: string;
  }

  let {
    name,
    label,
    values = $bindable([]),
    placeholder = "Type and press Enter...",
    error,
  }: Props = $props();

  let inputValue = $state("");

  function addTag() {
    const val = inputValue.trim();
    if (val && !values.includes(val)) {
      values = [...values, val];
    }
    inputValue = "";
  }

  function removeTag(index: number) {
    values = values.filter((_, i) => i !== index);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !inputValue && values.length > 0) {
      values = values.slice(0, -1);
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData?.getData("text") ?? "";
    const newTags = text.split(",").map((t) => t.trim()).filter((t) => t && !values.includes(t));
    if (newTags.length > 0) {
      values = [...values, ...newTags];
    }
  }
</script>

<div class="space-y-1">
  {#if label}
    <label for={name} class="form-label">{label}</label>
  {/if}

  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="flex flex-wrap items-center gap-1.5 form-input min-h-[42px] cursor-text"
    class:border-red-500={error}
    onclick={(e) => { const input = (e.currentTarget as HTMLElement).querySelector('input'); input?.focus(); }}
    role="textbox"
    tabindex="-1"
  >
    {#each values as tag, i (tag)}
      <span class="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-md">
        {tag}
        <button
          type="button"
          onclick={() => removeTag(i)}
          class="text-gray-400 hover:text-red-500 transition-colors"
        >
          <X class="w-3 h-3" />
        </button>
      </span>
    {/each}
    <input
      type="text"
      id={name}
      bind:value={inputValue}
      onkeydown={handleKeydown}
      onpaste={handlePaste}
      {placeholder}
      class="flex-1 min-w-[100px] border-0 p-0 text-sm focus:ring-0 focus:outline-none bg-transparent"
    />
  </div>

  {#if error}
    <p class="text-xs text-red-600">{error}</p>
  {/if}
</div>
