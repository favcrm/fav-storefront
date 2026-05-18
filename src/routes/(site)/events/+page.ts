import { createFavCRM } from "$lib/favcrm";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, parent }) => {
  const { companyId } = await parent();
  const sdk = createFavCRM({ fetch, companyId });
  return {
    events: await sdk.events.list().catch(() => []),
  };
};
