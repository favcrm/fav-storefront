import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { CreateOrderRequest, OtpIdentifier } from "@favcrm/sdk";
import { requireStorefrontConfig, SITE_URL } from "$lib/config";
import { createFavCRM } from "$lib/favcrm";

type FetchFn = typeof globalThis.fetch;

type GuestBookingRequest = Parameters<
  ReturnType<typeof createFavCRM>["bookings"]["createGuest"]
>[0] & {
  guestInfo?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    phone: string;
    email?: string;
  };
  promotionCode?: string;
  creditsUsed?: string;
  paymentMethodId?: string;
};

function mcpJson(data: unknown): CallToolResult {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function mcpToolError(message: string): CallToolResult {
  return {
    isError: true,
    content: [{ type: "text", text: message }],
  };
}

function clampLimit(
  limit: number | undefined,
  fallback = 10,
  max = 50,
): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) return fallback;
  return Math.max(1, Math.min(Math.floor(limit), max));
}

function resolveUrl(path: string, origin: string): string {
  let base = origin;
  if (SITE_URL && !SITE_URL.includes("your-storefront.example.com")) {
    base = SITE_URL;
  }

  return `${base.replace(/\/$/, "")}${path}`;
}

function productUrl(slug: string | null | undefined, origin: string): string {
  return resolveUrl(slug ? `/shop/${slug}` : "/shop", origin);
}

function checkoutSuccessUrl(orderId: string, origin: string): string {
  return resolveUrl(
    `/checkout/success?order=${encodeURIComponent(orderId)}`,
    origin,
  );
}

function blogPostUrls(
  slug: string,
  origin: string,
): { url: string; markdownUrl: string } {
  return {
    url: resolveUrl(`/blog/${slug}`, origin),
    markdownUrl: resolveUrl(`/blog/${slug}/llms.txt`, origin),
  };
}

function bookingServiceUrls(
  serviceId: string | number,
  origin: string,
): { url: string; bookingUrl: string } {
  return {
    url: resolveUrl(`/bookings/${serviceId}`, origin),
    bookingUrl: resolveUrl(`/bookings/${serviceId}/book`, origin),
  };
}

function otpIdentifier(input: {
  phone?: string;
  email?: string;
}): OtpIdentifier | null {
  if (input.email) return { email: input.email };
  if (input.phone) return { phone: input.phone };
  return null;
}

function customerSdk(
  fetchFn: FetchFn,
  companyId: string | undefined,
  customerToken?: string,
): ReturnType<typeof createFavCRM> {
  const sdk = createFavCRM({ fetch: fetchFn, companyId });
  if (customerToken) sdk.setToken(customerToken);
  return sdk;
}

async function customerPortalGet<T>(
  fetchFn: FetchFn,
  companyIdHint: string | undefined,
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const { apiUrl, companyId } = requireStorefrontConfig(companyIdHint);
  const query = params ? `?${new URLSearchParams(params)}` : "";
  const response = await fetchFn(
    `${apiUrl}/v6/customer-portal${path}${query}`,
    {
      headers: {
        Accept: "application/json",
        "X-Company-Id": companyId,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Customer portal request failed: ${response.status}`);
  }

  const json = await response.json();
  if (json && typeof json === "object" && "data" in json) {
    return json.data as T;
  }
  return json as T;
}

export function createCustomerMcpServer(
  fetchFn: FetchFn,
  origin: string,
  companyId: string | undefined,
): McpServer {
  const sdk = customerSdk(fetchFn, companyId);
  const server = new McpServer(
    {
      name: "favcrm-customer-storefront",
      title: "FavCRM Customer Storefront",
      version: "1.0.0",
    },
    { capabilities: { tools: {} } },
  );

  server.tool(
    "get_customer_login_channel",
    "Get whether this storefront expects customer login OTP by email, SMS, or WhatsApp.",
    {},
    async () => {
      return mcpJson(await sdk.auth.getLoginChannel());
    },
  );

  server.tool(
    "request_customer_login_otp",
    "Send a one-time customer login code. Use this before tools that require customerToken.",
    {
      phone: z.string().optional(),
      email: z.string().email().optional(),
    },
    async (input) => {
      const identifier = otpIdentifier(input);
      if (!identifier) {
        return mcpToolError("Provide either phone or email.");
      }

      return mcpJson(await sdk.auth.sendOtp(identifier));
    },
  );

  server.tool(
    "verify_customer_login_otp",
    "Verify a customer login code and return customerToken for authenticated customer tools.",
    {
      phone: z.string().optional(),
      email: z.string().email().optional(),
      otp: z.string(),
    },
    async (input) => {
      const identifier = otpIdentifier(input);
      if (!identifier) {
        return mcpToolError("Provide either phone or email.");
      }

      return mcpJson(await sdk.auth.verifyOtp(identifier, input.otp));
    },
  );

  server.tool(
    "search_products",
    "Search the public product catalog with live storefront pricing and inventory.",
    {
      query: z.string().optional(),
      category_slug: z.string().optional(),
      brand_slug: z.string().optional(),
      collection_slug: z.string().optional(),
      featured: z.boolean().optional(),
      sort: z.enum(["name", "price_asc", "price_desc", "newest"]).optional(),
      limit: z.number().optional(),
    },
    async (input) => {
      const products = await sdk.shop.listProducts({
        search: input.query,
        category_slug: input.category_slug,
        brand_slug: input.brand_slug,
        collection_slug: input.collection_slug,
        featured: input.featured,
        sort: input.sort,
        limit: clampLimit(input.limit, 12),
      });
      return mcpJson({
        items: products.map((product) => ({
          ...product,
          url: productUrl(product.slug, origin),
        })),
      });
    },
  );

  server.tool(
    "get_product_details",
    "Get full details for one public product, including variations, options, and exact pricing.",
    { slug: z.string() },
    async ({ slug }) => {
      const product = await sdk.shop.getProduct(slug);
      return mcpJson({
        ...product,
        url: productUrl(product.slug, origin),
      });
    },
  );

  server.tool(
    "list_shop_options",
    "List public product categories, brands, collections, shipping methods, and payment methods used for shopping.",
    {
      include_shipping: z.boolean().optional(),
      order_amount: z.number().optional(),
    },
    async ({ include_shipping, order_amount }) => {
      const shippingPromise = include_shipping
        ? sdk.shop.listShippingMethods(order_amount).catch(() => [])
        : Promise.resolve([]);

      const [categories, brands, collections, paymentMethods, shippingMethods] =
        await Promise.all([
          sdk.shop.listCategories().catch(() => []),
          sdk.shop.listBrands().catch(() => []),
          sdk.shop.listCollections().catch(() => []),
          sdk.shop.listPaymentMethods().catch(() => []),
          shippingPromise,
        ]);

      return mcpJson({
        categories,
        brands,
        collections,
        paymentMethods,
        shippingMethods,
      });
    },
  );

  server.tool(
    "list_shop_offers",
    "List active storefront offers for a cart, product view, category view, or threshold context.",
    {
      context: z
        .enum([
          "product_view",
          "cart",
          "cart_threshold",
          "category_view",
          "post_order",
        ])
        .optional(),
      productId: z.number().optional(),
      productIds: z.array(z.number()).optional(),
      categoryId: z.number().optional(),
      total: z.number().optional(),
    },
    async (input) => {
      return mcpJson(await sdk.shop.listOffers(input));
    },
  );

  server.tool(
    "create_shop_order",
    "Create a guest shop order from selected products. Returns order status plus paymentUrl when online payment is required.",
    {
      lineItems: z
        .array(
          z.object({
            productId: z.number(),
            quantity: z.number().int().positive(),
            variationId: z.number().optional(),
          }),
        )
        .min(1),
      customerInfo: z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
      }),
      shippingAddress: z.object({
        addressLine1: z.string(),
        addressLine2: z.string().optional(),
        city: z.string(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
      }),
      shippingMethodId: z.number().optional(),
      promotionCode: z.string().optional(),
      paymentMethodId: z.string().optional(),
    },
    async (input) => {
      const request: CreateOrderRequest = {
        ...input,
        successUrl: resolveUrl("/checkout/success", origin),
        cancelUrl: resolveUrl("/checkout", origin),
      };
      const order = await sdk.shop.createOrder(request);
      return mcpJson({
        ...order,
        nextUrl: order.paymentUrl ?? checkoutSuccessUrl(order.orderId, origin),
      });
    },
  );

  server.tool(
    "check_shop_order_payment_status",
    "Check payment status for a shop order created through the storefront.",
    { orderId: z.string() },
    async ({ orderId }) => {
      return mcpJson(
        await customerPortalGet(
          fetchFn,
          companyId,
          `/shop/orders/${encodeURIComponent(orderId)}/payment-status`,
        ),
      );
    },
  );

  server.tool(
    "search_blog_posts",
    "Search or list public blog posts and announcements.",
    {
      query: z.string().optional(),
      category: z.string().optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
    },
    async ({ query, category, page, limit }) => {
      const result = await sdk.blog.list({
        search: query,
        category,
        page,
        limit: clampLimit(limit, 10),
      });
      return mcpJson({
        ...result,
        items: result.items.map((post) => ({
          ...post,
          ...blogPostUrls(post.slug, origin),
        })),
      });
    },
  );

  server.tool(
    "read_blog_post",
    "Read a public blog post by slug.",
    { slug: z.string() },
    async ({ slug }) => {
      const post = await sdk.blog.getBySlug(slug);
      return mcpJson({
        ...post,
        ...blogPostUrls(post.slug, origin),
      });
    },
  );

  server.tool(
    "list_upcoming_events",
    "List public events available on the storefront.",
    { limit: z.number().optional() },
    async ({ limit }) => {
      const events = await sdk.events.list();
      return mcpJson({
        items: events.slice(0, clampLimit(limit, 10)).map((event) => ({
          ...event,
          url: resolveUrl(`/events/${event.slug}`, origin),
        })),
      });
    },
  );

  server.tool(
    "get_event_details",
    "Get event details, sessions, capacity, and registration requirements by slug.",
    { slug: z.string() },
    async ({ slug }) => {
      const event = await sdk.events.get(slug);
      return mcpJson({
        ...event,
        url: resolveUrl(`/events/${event.slug}`, origin),
      });
    },
  );

  server.tool(
    "register_event",
    "Register an authenticated customer for an event. Requires customerToken from verify_customer_login_otp.",
    {
      customerToken: z.string(),
      eventSlug: z.string(),
      guestName: z.string(),
      email: z.string().email(),
      phone: z.string(),
      quantity: z.number().int().positive().optional(),
      sessionId: z.string(),
      promotionCode: z.string().optional(),
      creditsUsed: z.string().optional(),
    },
    async (input) => {
      const authedSdk = customerSdk(fetchFn, companyId, input.customerToken);
      const result = await authedSdk.events.register(input);
      return mcpJson({
        ...result,
        eventUrl: resolveUrl(`/events/${result.eventSlug}`, origin),
      });
    },
  );

  server.tool(
    "start_event_payment",
    "Create a Stripe payment intent for a paid event registration. Requires customerToken.",
    {
      customerToken: z.string(),
      registrationId: z.string(),
    },
    async ({ customerToken, registrationId }) => {
      const authedSdk = customerSdk(fetchFn, companyId, customerToken);
      return mcpJson(await authedSdk.events.startPayment(registrationId));
    },
  );

  server.tool(
    "list_my_event_registrations",
    "List the authenticated customer's event registrations. Requires customerToken.",
    {
      customerToken: z.string(),
    },
    async ({ customerToken }) => {
      const authedSdk = customerSdk(fetchFn, companyId, customerToken);
      return mcpJson(await authedSdk.events.listRegistrations());
    },
  );

  server.tool(
    "get_event_access",
    "Get online or hybrid event access instructions for a registration. Requires customerToken.",
    {
      customerToken: z.string(),
      registrationId: z.string(),
    },
    async ({ customerToken, registrationId }) => {
      const authedSdk = customerSdk(fetchFn, companyId, customerToken);
      return mcpJson(await authedSdk.events.getAccess(registrationId));
    },
  );

  server.tool(
    "list_booking_services",
    "List public booking services available to customers.",
    { limit: z.number().optional() },
    async ({ limit }) => {
      const services = await sdk.bookings.listServices();
      return mcpJson({
        items: services.slice(0, clampLimit(limit, 20)).map((service) => ({
          ...service,
          ...bookingServiceUrls(service.id, origin),
        })),
      });
    },
  );

  server.tool(
    "get_booking_service",
    "Get public booking service details, addons, staff and resources.",
    { serviceId: z.string() },
    async ({ serviceId }) => {
      const [service, staff, resources] = await Promise.all([
        sdk.bookings.getService(serviceId),
        sdk.bookings.getStaff(serviceId).catch(() => []),
        sdk.bookings.getResources(serviceId).catch(() => []),
      ]);
      return mcpJson({
        ...service,
        staff,
        resources,
        ...bookingServiceUrls(service.id, origin),
      });
    },
  );

  server.tool(
    "get_booking_slots",
    "Get available customer booking slots for a service on a date.",
    {
      serviceId: z.string(),
      date: z.string().describe("Date in YYYY-MM-DD format"),
      staffId: z.string().optional(),
      resourceId: z.string().optional(),
    },
    async (input) => {
      const result = await sdk.bookings.getTimeSlots(input.serviceId, {
        date: input.date,
        staffId: input.staffId,
        resourceId: input.resourceId,
        createQuotes: true,
      });
      return mcpJson(result);
    },
  );

  server.tool(
    "create_guest_booking",
    "Create a guest booking for a customer. Include guestInfo unless the service allows anonymous guest context.",
    {
      serviceId: z.string(),
      bookingDate: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      scheduleId: z.string().optional(),
      staffId: z.string().optional(),
      resourceId: z.string().optional(),
      addonIds: z.array(z.string()).optional(),
      quoteId: z.string().optional(),
      notes: z.string().optional(),
      promotionCode: z.string().optional(),
      creditsUsed: z.string().optional(),
      paymentMethodId: z.string().optional(),
      guestInfo: z
        .object({
          name: z.string().optional(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          phone: z.string(),
          email: z.string().email().optional(),
        })
        .optional(),
    },
    async (input) => {
      const booking = await sdk.bookings.createGuest(
        input as GuestBookingRequest,
      );
      return mcpJson({
        ...booking,
        bookingUrl: resolveUrl(
          `/bookings/${input.serviceId}/book/${booking.id}`,
          origin,
        ),
        paymentUrl: resolveUrl(
          `/bookings/${input.serviceId}/book/${booking.id}/pay`,
          origin,
        ),
      });
    },
  );

  return server;
}

export async function handleCustomerMcpRequest(
  request: Request,
  fetchFn: FetchFn,
  companyId: string | undefined,
): Promise<Response> {
  try {
    const origin = new URL(request.url).origin;
    const server = createCustomerMcpServer(fetchFn, origin, companyId);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);
    return await transport.handleRequest(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message: `Customer MCP error: ${message}` },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
}
