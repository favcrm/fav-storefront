import { describe, expect, it, vi } from "vitest";
import { handleCustomerMcpRequest } from "./server";

type FetchFn = Parameters<typeof handleCustomerMcpRequest>[1];
type ToolResultContent = { type: "text"; text: string };
type JsonRpcResponse = {
  result: {
    serverInfo: { name: string };
    capabilities: { tools?: unknown };
    tools: Array<{ name: string }>;
    content: ToolResultContent[];
    isError?: boolean;
  };
};

function mcpRequest(body: unknown): Request {
  return new Request("http://store.test/api/mcp", {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function mcpJson(
  body: unknown,
  fetchFn: FetchFn = vi.fn() as FetchFn,
): Promise<JsonRpcResponse> {
  const response = await handleCustomerMcpRequest(
    mcpRequest(body),
    fetchFn,
    "test-company",
  );
  return response.json() as Promise<JsonRpcResponse>;
}

describe("customer MCP server", () => {
  it("initializes over stateless Streamable HTTP", async () => {
    const json = await mcpJson({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "vitest", version: "1.0.0" },
      },
    });

    expect(json.result.serverInfo.name).toBe("favcrm-customer-storefront");
    expect(json.result.capabilities.tools).toBeDefined();
  });

  it("lists the core customer tools", async () => {
    const json = await mcpJson({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    });

    const toolNames = json.result.tools.map((tool) => tool.name);
    expect(toolNames).toContain("search_products");
    expect(toolNames).toContain("create_guest_booking");
    expect(toolNames).toContain("register_event");
    expect(toolNames).toContain("read_blog_post");
    expect(toolNames).toContain("check_shop_order_payment_status");
  });

  it("calls a public read tool through the SDK fetch boundary", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          success: true,
          data: [
            {
              id: 1,
              name: "Test Product",
              slug: "test-product",
              price: 100,
            },
          ],
        }),
    });

    const json = await mcpJson(
      {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "search_products",
          arguments: { query: "test", limit: 1 },
        },
      },
      fetchFn,
    );

    const payload = JSON.parse(json.result.content[0].text);
    expect(payload.items[0].name).toBe("Test Product");
    expect(payload.items[0].url).toBe("http://store.test/shop/test-product");
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it("returns a tool error when OTP identifier is missing", async () => {
    const json = await mcpJson({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "request_customer_login_otp",
        arguments: {},
      },
    });

    expect(json.result.isError).toBe(true);
    expect(json.result.content[0].text).toBe("Provide either phone or email.");
  });

  function verifyOtpCall(fetchFn: FetchFn) {
    return mcpJson(
      {
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: {
          name: "verify_customer_login_otp",
          arguments: { phone: "+85260000000", otp: "123456" },
        },
      },
      fetchFn,
    );
  }

  function apiError(status: number, error: unknown): FetchFn {
    return vi.fn().mockResolvedValue({
      ok: false,
      status,
      statusText: "",
      json: () => Promise.resolve({ success: false, error }),
    }) as FetchFn;
  }

  it("reports REGISTRATION_REQUIRED without leaking the registration ticket", async () => {
    const json = await verifyOtpCall(
      apiError(403, {
        code: "REGISTRATION_REQUIRED",
        message: "Registration required",
        details: {
          registrationTicket: "secret-ticket",
          name: "WhatsApp Contact",
          phone: "+85260000000",
          expiresIn: 900,
        },
      }),
    );

    expect(json.result.isError).toBe(true);
    const text = json.result.content[0].text;
    expect(text).not.toContain("secret-ticket");
    const payload = JSON.parse(text);
    expect(payload).toMatchObject({
      code: "REGISTRATION_REQUIRED",
      registrationRequired: true,
      name: "WhatsApp Contact",
      phone: "+85260000000",
    });
    expect(payload).not.toHaveProperty("registrationTicket");
    expect(payload).not.toHaveProperty("customerToken");
  });

  it("reports REGISTRATION_REVIEW_REQUIRED with the API message", async () => {
    const json = await verifyOtpCall(
      apiError(409, {
        code: "REGISTRATION_REVIEW_REQUIRED",
        message: "Please contact the store to complete your registration.",
      }),
    );

    expect(json.result.isError).toBe(true);
    expect(JSON.parse(json.result.content[0].text)).toEqual({
      code: "REGISTRATION_REVIEW_REQUIRED",
      registrationReviewRequired: true,
      message: "Please contact the store to complete your registration.",
    });
  });
});
