<script lang="ts">
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { createFavCRM } from "$lib/favcrm";
  import { authStore, logout } from "$lib/stores/auth";
  import type { Member } from "@favcrm/sdk";

  let member = $state<Member | null>(null);
  let error = $state("");

  async function loadMember() {
    if (!$authStore.jwt) {
      await goto("/login");
      return;
    }
    const sdk = createFavCRM();
    sdk.setToken($authStore.jwt);
    try {
      member = await sdk.members.getProfile();
    } catch (err) {
      error = err instanceof Error ? err.message : "Unable to load profile";
    }
  }

  function signOut() {
    logout();
    goto("/");
  }

  $effect(() => {
    if (browser) loadMember();
  });
</script>

<section class="page-shell">
  <div class="member-panel">
    <p class="eyebrow">Member portal</p>
    <h1>{member?.name ?? $authStore.memberName ?? "Member"}</h1>
    {#if error}
      <p class="form-error">{error}</p>
    {:else if member}
      <dl>
        <div><dt>Phone</dt><dd>{member.phone}</dd></div>
        <div><dt>Email</dt><dd>{member.email ?? "Not provided"}</dd></div>
        <div><dt>Tier</dt><dd>{member.membershipTier?.name ?? "Standard"}</dd></div>
      </dl>
    {:else}
      <p>Loading profile...</p>
    {/if}
    <button class="secondary-link" type="button" onclick={signOut}>Sign out</button>
  </div>
</section>
