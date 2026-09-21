// The strings that must agree character for character: the token audience,
// the discovery documents, and the address typed into Claude. No trailing slash.
export const BASE_URL = (process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/$/, "");

export const ISSUER = `${BASE_URL}/api/auth`;
export const MCP_RESOURCE = `${BASE_URL}/mcp`;

// Two scopes, named after what the salon keeps. Not one per table.
export const MCP_SCOPES = ["bookings:read", "bookings:write"] as const;

// What each scope means, in the salon's words. Used by the consent screen and
// the Connected apps page, never the raw strings.
export const SCOPE_LABELS: Record<string, string> = {
  "bookings:read": "See services, stylists, free times and the diary",
  "bookings:write": "Book appointments and cancel them",
  openid: "Confirm who you are",
  profile: "See your name",
  email: "See your email address",
  offline_access: "Stay connected without asking you to sign in each time",
};
