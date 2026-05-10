import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

const sections = {
  orders: {
    title: "Orders",
    description: "Review order activity and fulfillment workflows.",
    portalPath: "/orders",
  },
  products: {
    title: "Products",
    description:
      "Manage catalog items, prices, images, stock, and publication status.",
    portalPath: "/products",
  },
  categories: {
    title: "Categories",
    description:
      "Organize storefront catalog navigation and product groupings.",
    portalPath: "/categories",
  },
  bookings: {
    title: "Bookings",
    description:
      "Configure services, booking resources, staff, and availability.",
    portalPath: "/bookings",
  },
  customers: {
    title: "Customers",
    description: "Manage customer profiles, member records, and CRM activity.",
    portalPath: "/customers",
  },
  events: {
    title: "Events",
    description: "Publish events and manage registrations.",
    portalPath: "/events",
  },
  promotions: {
    title: "Promotions",
    description: "Create coupons, rewards, campaigns, and storefront offers.",
    portalPath: "/promotions",
  },
  announcements: {
    title: "Announcements",
    description: "Publish operational notices and marketing messages.",
    portalPath: "/announcements",
  },
  blog: {
    title: "Blog",
    description: "Draft and publish customer-facing content.",
    portalPath: "/blog",
  },
  settings: {
    title: "Settings",
    description:
      "Configure customer portal modules, branding, payments, and integrations.",
    portalPath: "/settings/customer-portal",
  },
} as const;

export const load: PageLoad = ({ params }) => {
  const section = sections[params.section as keyof typeof sections];

  if (!section) {
    throw error(404, "Admin section not found");
  }

  return {
    section,
    sectionKey: params.section,
  };
};
