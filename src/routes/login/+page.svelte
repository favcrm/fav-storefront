<script lang="ts">
  import { goto } from "$app/navigation";
  import { createFavCRM } from "$lib/favcrm";
  import { login } from "$lib/stores/auth";

  let phone = $state("");
  let otp = $state("");
  let sent = $state(false);
  let loading = $state(false);
  let error = $state("");

  const sdk = createFavCRM();

  async function sendOtp() {
    loading = true;
    error = "";
    try {
      await sdk.auth.sendOtp(phone);
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
      const result = await sdk.auth.verifyOtp(phone, otp);
      login({
        jwt: result.accessToken ?? result.token,
        memberUuid: result.memberUuid,
        memberName: result.memberName,
        phone: result.phone,
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
    <p class="eyebrow">Member access</p>
    <h1>Sign in with OTP</h1>
    <label>
      Phone
      <input bind:value={phone} autocomplete="tel" placeholder="+852 6000 0000" />
    </label>
    {#if sent}
      <label>
        One-time code
        <input bind:value={otp} inputmode="numeric" autocomplete="one-time-code" />
      </label>
    {/if}
    {#if error}<p class="form-error">{error}</p>{/if}
    {#if sent}
      <button class="primary-link" type="button" disabled={loading} onclick={verifyOtp}>
        Verify and continue
      </button>
    {:else}
      <button class="primary-link" type="button" disabled={loading} onclick={sendOtp}>
        Send OTP
      </button>
    {/if}
  </form>
</section>
