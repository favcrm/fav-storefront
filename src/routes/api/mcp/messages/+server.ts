import { handleCustomerMcpRequest } from "$lib/mcp/server";
import type { RequestHandler } from "./$types";

const handleMcp: RequestHandler = ({ request, fetch }) =>
  handleCustomerMcpRequest(request, fetch);

export const POST = handleMcp;
