<script lang="ts">
  import { CalendarDays, LogOut } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { createFavCRM } from "$lib/favcrm";
  import { authStore, logout } from "$lib/stores/auth";
  import Eyebrow from "$lib/components/site/Eyebrow.svelte";
  import Button from "$lib/components/site/Button.svelte";
  import type { Member } from "@favcrm/sdk";

  let member = $state<Member | null>(null);
  let error = $state("");
  let loaded = $state(false);

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
    } finally {
      loaded = true;
    }
  }

  function signOut() {
    logout();
    goto("/");
  }

  function initials(name: string | null | undefined) {
    if (!name) return "M";
    const parts = name.trim().split(/\s+/);
    return (
      (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")
    ).toUpperCase() || "M";
  }

  $effect(() => {
    if (browser) loadMember();
  });
</script>

<section class="site-container member-shell">
  <aside class="member-summary">
    <span class="member-avatar">
      {initials(member?.name ?? $authStore.memberName)}
    </span>
    <Eyebrow>Member portal</Eyebrow>
    <h1 class="member-name">
      {member?.name ?? $authStore.memberName ?? "Member"}
    </h1>
    {#if member?.membershipTier?.name}
      <span class="member-tier">{member.membershipTier.name}</span>
    {/if}
    <div class="member-actions">
      <Button href="/member/bookings" variant="secondary">
        <CalendarDays size={16} strokeWidth={1.6} />
        My bookings
      </Button>
      <Button variant="ghost" onclick={signOut}>
        <LogOut size={16} strokeWidth={1.6} />
        Sign out
      </Button>
    </div>
  </aside>

  <div class="member-details">
    {#if error}
      <p class="form-error">{error}</p>
    {:else if member}
      <dl>
        <div><dt>Phone</dt><dd>{member.phone}</dd></div>
        <div><dt>Email</dt><dd>{member.email ?? "Not provided"}</dd></div>
        <div>
          <dt>Tier</dt>
          <dd>{member.membershipTier?.name ?? "Standard"}</dd>
        </div>
      </dl>
    {:else if !loaded}
      <dl>
        {#each Array(3) as _}
          <div>
            <dt>
              <span style="display:inline-block;width:60px;height:10px;background:var(--line);border-radius:4px;"></span>
            </dt>
            <dd>
              <span style="display:inline-block;width:120px;height:10px;background:var(--line);border-radius:4px;"></span>
            </dd>
          </div>
        {/each}
      </dl>
    {/if}
  </div>
</section>

<style>
  .member-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
</style>
