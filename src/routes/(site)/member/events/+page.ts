import { goto } from "$app/navigation";
import { get } from "svelte/store";
import { authStore } from "$lib/stores/auth";
import type { PageLoad } from "./$types";

export const load: PageLoad = async () => {
  const state = get(authStore);
  if (!state.jwt) {
    // If running on client and not logged in, redirect to login
    // If SSR, the layout should handle it, but just in case:
    if (typeof window !== "undefined") {
      goto("/login?next=/member/events");
    }
  }
  return {};
};
