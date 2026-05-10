import { browser } from "$app/environment";
import { writable, get } from "svelte/store";
import { FAVCRM_COMPANY_ID } from "$lib/config";

const STORAGE_PREFIX = "favcrm_storefront_auth";

export interface AuthState {
  jwt: string | null;
  memberUuid: string | null;
  memberName: string | null;
  phone: string | null;
}

const emptyState: AuthState = {
  jwt: null,
  memberUuid: null,
  memberName: null,
  phone: null,
};

function storageKey() {
  return `${STORAGE_PREFIX}_${FAVCRM_COMPANY_ID ?? "unknown"}`;
}

function loadAuth(): AuthState {
  if (!browser) return emptyState;
  try {
    const raw = localStorage.getItem(storageKey());
    return raw ? { ...emptyState, ...JSON.parse(raw) } : emptyState;
  } catch {
    return emptyState;
  }
}

function saveAuth(state: AuthState) {
  if (!browser) return;
  if (state.jwt) {
    localStorage.setItem(storageKey(), JSON.stringify(state));
  } else {
    localStorage.removeItem(storageKey());
  }
}

export const authStore = writable<AuthState>(loadAuth());
authStore.subscribe(saveAuth);

export function login(state: AuthState) {
  authStore.set(state);
}

export function logout() {
  authStore.set(emptyState);
}

export function getAuthToken() {
  return get(authStore).jwt;
}
