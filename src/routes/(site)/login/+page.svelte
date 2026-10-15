<script lang="ts">
  import { Lock } from "lucide-svelte";
  import { CustomerAuthErrorCodes, FavCRMError } from "@favcrm/sdk";
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
  // Set when the OTP was correct but the number can't sign in yet: a WhatsApp
  // contact that never registered, or several unregistered records the merchant
  // must merge. This storefront has no signup page, so we only explain and point
  // the customer to the contact page.
  let registrationNotice = $state<"required" | "review" | null>(null);
  let reviewMessage = $state("");
  let channel = $state<"whatsapp" | "sms" | "email">("email");


  function setIdentifier(value: string) {
    identifier = value;
    registrationNotice = null;
    reviewMessage = "";
  }
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
    registrationNotice = null;
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
      if (err instanceof FavCRMError && err.code === CustomerAuthErrorCodes.REGISTRATION_REQUIRED) {
        registrationNotice = "required";
      } else if (
        err instanceof FavCRMError &&
        err.code === CustomerAuthErrorCodes.REGISTRATION_REVIEW_REQUIRED
      ) {
        registrationNotice = "review";
        reviewMessage = err.message;
      } else {
        error = err instanceof Error ? err.message : "Unable to sign in";
      }
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
        bind:value={() => identifier, setIdentifier}
      />
    {:else}
      <Field
        label="Phone"
        name="phone"
        type="tel"
        autocomplete="tel"
        placeholder="+852 6000 0000"
        bind:value={() => identifier, setIdentifier}
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

    {#if registrationNotice === "required"}
      <div class="notice notice--success" role="status">
        <span>
          We already have your number from WhatsApp, but it isn't registered as a member yet.
          Please <a href="/contact">contact us</a> to finish registering and become a member.
        </span>
      </div>
    {:else if registrationNotice === "review"}
      <div class="notice notice--error" role="alert">
        <span>
          {reviewMessage || "We need to review your details before you can sign in."}
          Please <a href="/contact">contact us</a> to complete your registration.
        </span>
      </div>
    {/if}

    {#if sent}
      <Button onclick={verifyOtp} disabled={loading} size="lg">
        {loading ? "Verifying..." : "Verify and continue"}
      </Button>
      <Button
        variant="ghost"
        onclick={() => {
          sent = false;
          otp = "";
          registrationNotice = null;
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
