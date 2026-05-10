<script lang="ts">
  import { Check, Mail, MessageCircle, Phone } from "lucide-svelte";
  import { createFavCRM } from "$lib/favcrm";
  import Eyebrow from "$lib/components/site/Eyebrow.svelte";
  import Button from "$lib/components/site/Button.svelte";
  import Field from "$lib/components/site/Field.svelte";
  import type { LayoutData } from "../$types";

  let { data }: { data: LayoutData } = $props();

  let name = $state("");
  let email = $state("");
  let phone = $state("");
  let message = $state("");
  let status = $state("");
  let success = $state(false);
  let loading = $state(false);

  const brandEmail = $derived(data.tenant?.brandEmail ?? "");

  async function submit() {
    loading = true;
    status = "";
    success = false;
    try {
      await createFavCRM().contact.submit({ name, email, phone, message });
      status = "Thanks. Your enquiry has been sent.";
      success = true;
      name = "";
      email = "";
      phone = "";
      message = "";
    } catch (err) {
      status = err instanceof Error ? err.message : "Unable to send enquiry.";
      success = false;
    } finally {
      loading = false;
    }
  }
</script>

<section class="site-container contact-shell">
  <aside class="contact-aside">
    <div>
      <Eyebrow>Contact</Eyebrow>
      <h1 class="site-h1">Get in touch</h1>
      <p class="site-lead">
        We read every message. Expect a reply within one working day.
      </p>
    </div>
    {#if brandEmail}
      <a class="contact-channel" href={`mailto:${brandEmail}`}>
        <Mail size={18} strokeWidth={1.6} />
        <span>{brandEmail}</span>
      </a>
    {/if}
    <div class="contact-channel">
      <MessageCircle size={18} strokeWidth={1.6} />
      <span>Live chat available during business hours</span>
    </div>
    <div class="contact-channel">
      <Phone size={18} strokeWidth={1.6} />
      <span>Phone enquiries via the form</span>
    </div>
  </aside>

  <form class="contact-form" onsubmit={(event) => event.preventDefault()}>
    <Field label="Name" name="name" bind:value={name} required />
    <Field
      label="Email"
      name="email"
      type="email"
      autocomplete="email"
      bind:value={email}
    />
    <Field
      label="Phone"
      name="phone"
      type="tel"
      autocomplete="tel"
      bind:value={phone}
    />
    <Field
      label="Message"
      name="message"
      type="textarea"
      rows={5}
      required
      bind:value={message}
    />
    {#if status}
      <p class={`notice ${success ? "notice--success" : "notice--error"}`}>
        {#if success}
          <Check size={16} strokeWidth={2} />
        {/if}
        {status}
      </p>
    {/if}
    <Button onclick={submit} disabled={loading} size="lg">
      {loading ? "Sending..." : "Send enquiry"}
    </Button>
  </form>
</section>
