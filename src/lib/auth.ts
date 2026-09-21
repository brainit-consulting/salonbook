import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { mcp } from "@better-auth/mcp";
import { count } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as userTable } from "./db/auth-schema";
import { sendEmail } from "@/lib/email";
import { BASE_URL, MCP_RESOURCE, MCP_SCOPES } from "@/lib/mcp-resource";
import VerifyEmail from "@/emails/verify-email";
import ResetPassword from "@/emails/reset-password";
import ConfirmDelete from "@/emails/confirm-delete";

export const auth = betterAuth({
  // BASE_URL falls back to localhost when the setting is missing or empty. The
  // agent-access plugins need a real address at start-up; without one every
  // owner page answered 500 (measured). The System page reports the gap instead.
  baseURL: BASE_URL,
  database: drizzleAdapter(db, { provider: "pg" }),

  emailAndPassword: {
    enabled: true,
    // void, not await: awaiting would make the response slower when the
    // account exists, which tells a stranger who has one.
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Reset your Pepper Tree Hair password",
        react: ResetPassword({ url, name: user.name }),
        template: "reset-password",
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Confirm your email address",
        react: VerifyEmail({ url, name: user.name }),
        template: "verify-email",
      });
    },
  },

  session: {
    // Off on purpose. With the default, the devices list in settings stops
    // loading a day after sign-in. Deleting the account asks for the password.
    freshAge: 0,
  },

  user: {
    additionalFields: {
      role: {
        type: ["user", "admin"],
        required: false,
        defaultValue: "user",
        input: false, // nobody can set their own role through the API
      },
    },
    changeEmail: { enabled: true },
    deleteUser: {
      enabled: true,
      deleteTokenExpiresIn: 60 * 60,
      sendDeleteAccountVerification: async ({ user, url }) => {
        void sendEmail({
          to: user.email,
          subject: "Confirm deleting the owner account",
          react: ConfirmDelete({ url, name: user.name }),
          template: "confirm-delete",
        });
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        // One salon, one owner. The first account becomes the owner and
        // sign-up closes after that.
        before: async (user) => {
          const [row] = await db.select({ n: count() }).from(userTable);
          if (row.n > 0) {
            throw new APIError("FORBIDDEN", {
              message: "This salon already has an owner. Sign-up is closed.",
            });
          }
          return { data: { ...user, role: "admin" } };
        },
      },
    },
  },

  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/oauth2/register": { window: 60, max: 5 },
      "/oauth2/token": { window: 60, max: 30 },
      "/delete-user": { window: 60, max: 3 },
    },
  },

  plugins: [
    jwt(),
    mcp({
      loginPage: "/sign-in",
      consentPage: "/oauth/consent",
      resource: MCP_RESOURCE,

      // Dynamic registration is the older way for an agent to get a client id.
      // It stays on beside client metadata documents (cimd, below) because the
      // client picks, and turning it off strands agents that have not moved yet.
      // Registering creates a client record, not access: nothing can be read
      // until the owner approves it on the consent screen.
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,

      scopes: ["openid", "profile", "email", "offline_access", ...MCP_SCOPES],
      clientRegistrationDefaultScopes: ["openid", "profile", "email"],
      clientRegistrationAllowedScopes: ["offline_access", ...MCP_SCOPES],
    }),
    cimd({
      fetchClientMetadataResource,
      metadataProfile: "mcp-2026-07-28",
    }),
    nextCookies(), // must stay last
  ],
});
