import { handleCustomerMcpRequest } from "$lib/mcp/server";
import type { RequestHandler } from "./$types";

const handleMcp: RequestHandler = ({ request, fetch }) =>
  handleCustomerMcpRequest(request, fetch);

export const GET = handleMcp;
export const POST = handleMcp;
export const DELETE = handleMcp;
