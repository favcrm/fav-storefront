import { createFavCRM } from "$lib/favcrm";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ fetch, url, locals }) => {
  const sdk = createFavCRM({ fetch, companyId: locals.companyId });
  const baseUrl = url.origin;

  let blogPosts: any[] = [];
  try {
    const postsResult = await sdk.blog.list({ limit: 15 });
    blogPosts = postsResult?.items ?? [];
  } catch (e) {
    console.error("Failed to fetch blog posts for llms.txt", e);
  }

  // Create standard llmstxt.org content
  let content = `# Storefront Directory

This is the agent-friendly directory for our site. You can find our latest content below.

## Model Context Protocol (MCP)

This storefront exposes a public customer MCP server for AI agents.

- Streamable HTTP endpoint: ${baseUrl}/api/mcp
- Compatibility endpoint: ${baseUrl}/api/mcp/sse
- Message endpoint alias: ${baseUrl}/api/mcp/messages

Available customer tools:

- get_customer_login_channel: see whether login OTP uses email, SMS, or WhatsApp.
- request_customer_login_otp: send a customer one-time login code.
- verify_customer_login_otp: verify the code and receive a customerToken for authenticated tools.
- search_products: search products with live pricing and inventory.
- get_product_details: read product options, variations, stock, and pricing.
- list_shop_options: read categories, brands, collections, shipping methods, and payment methods.
- list_shop_offers: read active upsell, cross-sell, bundle, and cart offers.
- create_shop_order: create a guest order and return the next checkout or payment URL.
- check_shop_order_payment_status: check whether a storefront order has been paid.
- search_blog_posts: search or list blog posts.
- read_blog_post: read a blog post by slug.
- list_upcoming_events: list public events.
- get_event_details: read event sessions, capacity, and pricing.
- register_event: register an authenticated customer for an event.
- start_event_payment: start payment for a paid event registration.
- list_my_event_registrations: list an authenticated customer's event registrations.
- get_event_access: retrieve online or hybrid event access instructions.
- list_booking_services: list public booking services.
- get_booking_service: read booking service, staff, resource, and addon details.
- get_booking_slots: find available booking slots.
- create_guest_booking: create a guest booking and return the booking/payment URL.

Authenticated customer tools require a customerToken from verify_customer_login_otp. Merchant/admin authentication is never required for this public storefront MCP server.

Recommended customer MCP flows:

Shopping:

1. search_products
2. get_product_details
3. list_shop_options
4. list_shop_offers when offers may affect the cart
5. create_shop_order
6. Give the customer the returned paymentUrl or nextUrl
7. check_shop_order_payment_status when payment confirmation is needed

Booking:

1. list_booking_services
2. get_booking_service
3. get_booking_slots
4. create_guest_booking with guestInfo
5. Give the customer the returned bookingUrl or paymentUrl

Event registration:

1. list_upcoming_events
2. get_event_details
3. get_customer_login_channel
4. request_customer_login_otp
5. Ask the customer for the OTP
6. verify_customer_login_otp
7. register_event with customerToken
8. start_event_payment for paid events
9. list_my_event_registrations and get_event_access for later access

Blog reading:

1. search_blog_posts
2. read_blog_post
3. Prefer returned markdownUrl values when an agent-friendly page is needed

## Recent Blog Posts
`;

  if (blogPosts.length > 0) {
    for (const post of blogPosts) {
      // Basic post list
      content += `- [${post.title}](${baseUrl}/blog/${post.slug})\n`;
      if (post.excerpt) {
        content += `  > ${post.excerpt}\n`;
      }
      content += `  Markdown view: ${baseUrl}/blog/${post.slug}/llms.txt\n\n`;
    }
  } else {
    content += `*No blog posts available at the moment.*\n`;
  }

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
