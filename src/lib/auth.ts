import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getDb } from "./db";

if (process.env.NODE_ENV !== "production") {
  console.log("=== AUTH CONFIG ===", {
    baseURL: process.env.BETTER_AUTH_URL,
    nodeEnv: process.env.NODE_ENV,
    hasDBUrl: !!process.env.DATABASE_URL,
  });
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],
  database: prismaAdapter(getDb(), {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      language: {
        type: "string",
        required: false,
        defaultValue: "es",
        input: true,
      },
      role: {
        type: ["CLIENT", "PM", "ADMIN"] as const,
        required: false,
        defaultValue: "CLIENT",
        input: false,
      },
      businessName: {
        type: "string",
        required: false,
        input: true,
      },
      businessType: {
        type: "string",
        required: false,
        input: true,
      },
      timezone: {
        type: "string",
        required: false,
        defaultValue: "America/Chicago",
        input: true,
      },
      allianceId: {
        type: "string",
        required: false,
        input: false,
      },
      onboardingCompleted: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  advanced: {
    cookiePrefix: "better-auth",
    crossSubDomainCookies: {
      enabled: false,
    },
    defaultCookieAttributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (process.env.NODE_ENV !== "production") {
            console.log(`[AUTH] New user created: ${user.email} (${user.role})`);
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
