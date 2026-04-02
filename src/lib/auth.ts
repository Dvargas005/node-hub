import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

function createAuth() {
  const prisma = new PrismaClient();

  return betterAuth({
    database: prismaAdapter(prisma, {
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
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            console.log(
              `[AUTH] New user created: ${user.email} (${user.role})`
            );
          },
        },
      },
    },
  });
}

type AuthInstance = ReturnType<typeof createAuth>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: any = null;

export function getAuth(): AuthInstance {
  if (!_auth) {
    _auth = createAuth();
  }
  return _auth as AuthInstance;
}

// Proxy that lazily initializes auth on first access
export const auth: AuthInstance = new Proxy({} as AuthInstance, {
  get(_target, prop) {
    if (prop === "then" || prop === "catch") return undefined;
    const instance = getAuth();
    const value = (instance as unknown as Record<string | symbol, unknown>)[
      prop
    ];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

export type Session = typeof auth.$Infer.Session;
