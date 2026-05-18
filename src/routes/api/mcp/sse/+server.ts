import { handleCustomerMcpRequest } from "$lib/mcp/server";
import type { RequestHandler } from "./$types";

const handleMcp: RequestHandler = ({ request, fetch, locals }) =>
  handleCustomerMcpRequest(request, fetch, locals.companyId);

export const GET = handleMcp;
export const POST = handleMcp;
export const DELETE = handleMcp;
