<script lang="ts">
  import { Lock } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { createFavCRM } from "$lib/favcrm";
  import { login } from "$lib/stores/auth";
  import Button from "$lib/components/site/Button.svelte";
  import Field from "$lib/components/site/Field.svelte";
  import Eyebrow from "$lib/components/site/Eyebrow.svelte";
  import { onMount } from "svelte";

  let identifier = $state("");
  let otp = $state("");
  let sent = $state(false);
  let loading = $state(false);
  let error = $state("");
  let channel = $state<"whatsapp" | "sms" | "email">("whatsapp");

  const sdk = createFavCRM();

  onMount(async () => {
    try {
      const res = await sdk.auth.getLoginChannel();
      if (res && res.channel) {
        channel = res.channel;
      }
    } catch {
      // Keep default
    }
  });

  async function sendOtp() {
    loading = true;
    error = "";
    try {
      const payload = channel === "email" ? { email: identifier } : { phone: identifier };
      await sdk.auth.sendOtp(payload);
      sent = true;
    } catch (err) {
      error = err instanceof Error ? err.message : "Unable to send OTP";
    } finally {
      loading = false;
    }
  }

  async function verifyOtp() {
    loading = true;
    error = "";
    try {
      const payload = channel === "email" ? { email: identifier } : { phone: identifier };
      const result = await sdk.auth.verifyOtp(payload, otp);
      login({
        jwt: result.accessToken ?? result.token,
        memberUuid: result.memberUuid,
        memberName: result.memberName,
        phone: result.phone ?? null,
      });
      await goto("/member");
    } catch (err) {
      error = err instanceof Error ? err.message : "Unable to sign in";
    } finally {
      loading = false;
    }
  }
</script>

<section class="auth-shell">
  <form class="auth-panel" onsubmit={(event) => event.preventDefault()}>
    <span class="auth-mark"><Lock size={20} strokeWidth={1.6} /></span>
    <div>
      <Eyebrow>Member access</Eyebrow>
      <h1>Sign in to your account</h1>
    </div>
    <p class="auth-sub">
      {#if sent}
        We sent a one-time code to {identifier}.
      {:else}
        Enter your {channel === "email" ? "email address" : "phone number"} — we'll send you a one-time code.
      {/if}
    </p>

    {#if channel === "email"}
      <Field
        label="Email"
        name="email"
        type="email"
        autocomplete="email"
        placeholder="your@email.com"
        bind:value={identifier}
      />
    {:else}
      <Field
        label="Phone"
        name="phone"
        type="tel"
        autocomplete="tel"
        placeholder="+852 6000 0000"
        bind:value={identifier}
      />
    {/if}

    {#if sent}
      <Field
        label="One-time code"
        name="otp"
        autocomplete="one-time-code"
        inputmode="numeric"
        bind:value={otp}
      />
    {/if}

    {#if error}<p class="form-error">{error}</p>{/if}

    {#if sent}
      <Button onclick={verifyOtp} disabled={loading} size="lg">
        {loading ? "Verifying..." : "Verify and continue"}
      </Button>
      <Button
        variant="ghost"
        onclick={() => {
          sent = false;
          otp = "";
        }}
      >
        Use a different {channel === "email" ? "email" : "number"}
      </Button>
    {:else}
      <Button onclick={sendOtp} disabled={loading} size="lg">
        {loading ? "Sending..." : "Send OTP"}
      </Button>
    {/if}
  </form>
</section>
