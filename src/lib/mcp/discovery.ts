import "server-only";
import {
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from "@better-auth/oauth-provider";
import { auth } from "@/lib/auth";

// Better Auth lives under /api/auth, but an agent looks for these documents
// at the domain root, so the root routes hand the request over. They are
// public and meant to be read from anywhere, hence the open CORS. Nothing
// else in the app gets these headers.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

function open(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    const response = await handler(request);
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(cors)) headers.set(name, value);
    return new Response(response.body, { status: response.status, headers });
  };
}

export const OPTIONS = () => new Response(null, { status: 204, headers: cors });

/** Which sign-in server protects /mcp. The mcp() plugin writes the document. */
export const protectedResource = open((request) => auth.handler(request));

/** Where to register, ask for access and swap a code for a token. */
export const authorizationServer = open(oauthProviderAuthServerMetadata(auth));

export const openIdConfiguration = open(oauthProviderOpenIdConfigMetadata(auth));
