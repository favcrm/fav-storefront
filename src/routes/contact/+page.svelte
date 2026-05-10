<script lang="ts">
  import { createFavCRM } from "$lib/favcrm";

  let name = $state("");
  let email = $state("");
  let phone = $state("");
  let message = $state("");
  let status = $state("");
  let loading = $state(false);

  async function submit() {
    loading = true;
    status = "";
    try {
      await createFavCRM().contact.submit({ name, email, phone, message });
      status = "Thanks. Your enquiry has been sent.";
      name = "";
      email = "";
      phone = "";
      message = "";
    } catch (err) {
      status = err instanceof Error ? err.message : "Unable to send enquiry.";
    } finally {
      loading = false;
    }
  }
</script>

<section class="auth-shell">
  <form class="auth-panel" onsubmit={(event) => event.preventDefault()}>
    <p class="eyebrow">Contact</p>
    <h1>Send an enquiry</h1>
    <label>Name <input bind:value={name} required /></label>
    <label>Email <input bind:value={email} type="email" /></label>
    <label>Phone <input bind:value={phone} autocomplete="tel" /></label>
    <label>Message <textarea bind:value={message} rows="5" required></textarea></label>
    {#if status}<p>{status}</p>{/if}
    <button class="primary-link" type="button" disabled={loading} onclick={submit}>
      Send enquiry
    </button>
  </form>
</section>
