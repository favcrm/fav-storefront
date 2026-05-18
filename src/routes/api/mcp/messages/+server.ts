import { handleCustomerMcpRequest } from "$lib/mcp/server";
import type { RequestHandler } from "./$types";

const handleMcp: RequestHandler = ({ request, fetch, locals }) =>
  handleCustomerMcpRequest(request, fetch, locals.companyId);

export const POST = handleMcp;
