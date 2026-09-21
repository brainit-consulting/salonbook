import { requireMcpAuth } from "@better-auth/mcp";
import { createMcpHandler, McpServer, originValidationResponse } from "@modelcontextprotocol/server";
import { auth } from "@/lib/auth";
import { MCP_RESOURCE } from "@/lib/mcp-resource";
import { connectionStillAllowed } from "@/lib/mcp/still-allowed";
import { registerTools } from "@/lib/mcp/tools";

export const runtime = "nodejs";

// The SDK's own handler, not mcp-handler: its fetch() takes the verified
// token as authInfo, which is all requireMcpAuth needs to hand over.
// Older (2025) clients are still answered, statelessly, by the same tools.
const mcp = createMcpHandler(() => {
  const server = new McpServer({ name: "pepper-tree-hair", version: "1.0.0" });
  registerTools(server);
  return server;
});

// A missing or bad token is a real 401 with WWW-Authenticate, which is what
// makes an agent start sign-in. Reading is the least a connection needs; the
// tools that book and cancel check bookings:write themselves.
const authed = requireMcpAuth(
  auth,
  async (request, claims) => {
    const scopes = typeof claims.scope === "string" ? claims.scope.split(" ").filter(Boolean) : [];
    const rawClientId = claims.client_id ?? claims.azp;
    const clientId = typeof rawClientId === "string" ? rawClientId : "";

    // The token is still valid for up to an hour after the owner revokes the
    // connection, so ask the database on every call. A 401 sends the agent
    // back to sign-in and the consent screen.
    if (!(await connectionStillAllowed(String(claims.sub ?? ""), clientId))) {
      const metadata = `${new URL(MCP_RESOURCE).origin}/.well-known/oauth-protected-resource/mcp`;
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32001, message: "The owner has revoked this connection." },
          id: null,
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "WWW-Authenticate": `Bearer error="invalid_token", error_description="The owner has revoked this connection", resource_metadata="${metadata}"`,
          },
        },
      );
    }

    return mcp.fetch(request, {
      authInfo: {
        token: request.headers.get("authorization")?.replace(/^\S+\s+/, "") ?? "",
        clientId,
        scopes,
        expiresAt: claims.exp,
        // The owner's id comes from the token's subject and nowhere else.
        extra: { userId: claims.sub },
      },
    });
  },
  { resource: MCP_RESOURCE, requiredScopes: ["bookings:read"] },
);

// POST only: GET and DELETE get Next's 405. No CORS headers here on purpose.
// This route carries the token, so a browser page on another site is refused.
export async function POST(request: Request) {
  const refused = originValidationResponse(request, [new URL(MCP_RESOURCE).hostname]);
  return refused ?? authed(request);
}
