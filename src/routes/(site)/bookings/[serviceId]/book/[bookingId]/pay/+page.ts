import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params }) => {
  return { bookingId: params.bookingId, serviceId: params.serviceId };
};
