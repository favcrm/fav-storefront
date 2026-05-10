export const FAVCRM_API_URL = import.meta.env.VITE_FAVCRM_API_URL as
  | string
  | undefined;
export const FAVCRM_COMPANY_ID = import.meta.env.VITE_FAVCRM_COMPANY_ID as
  | string
  | undefined;
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? "";

export function requireStorefrontConfig() {
  if (!FAVCRM_API_URL) {
    throw new Error("VITE_FAVCRM_API_URL is not configured");
  }
  if (!FAVCRM_COMPANY_ID) {
    throw new Error("VITE_FAVCRM_COMPANY_ID is not configured");
  }

  return {
    apiUrl: FAVCRM_API_URL.replace(/\/$/, ""),
    companyId: FAVCRM_COMPANY_ID,
    siteUrl: SITE_URL.replace(/\/$/, ""),
  };
}
