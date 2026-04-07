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
    sendResetPassword: async ({ user, url }: { user: { email: string; name?: string }; url: string }) => {
      console.log("[AUTH] sendResetPassword called for:", user.email, "url:", url);
      try {
        const { sendEmail } = await import("@/lib/email");
        sendEmail(
          user.email,
          "Reset your password — N.O.D.E.",
          `<div style="font-family:sans-serif;background:#130A06;color:#F5F6FC;padding:40px;">
            <h1 style="color:#FFC919;">Password Reset</h1>
            <p>Hi ${user.name || "there"},</p>
            <p>You requested a password reset for your N.O.D.E. account.</p>
            <p>Click the button below to set a new password:</p>
            <a href="${url}" style="display:inline-block;background:#FFC919;color:#130A06;padding:12px 24px;text-decoration:none;font-weight:bold;margin:16px 0;">Reset my password →</a>
            <p style="opacity:0.6;font-size:12px;margin-top:30px;">If you didn't request this, you can safely ignore this email. The link expires in 1 hour.</p>
            <p style="opacity:0.6;font-size:12px;">N.O.D.E. — Powered by Nouvos</p>
          </div>`
        );
        console.log("[AUTH] Reset email sent to:", user.email);
      } catch (err) {
        console.error("[AUTH] sendResetPassword error:", err);
      }
    },
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
        type: ["CLIENT", "PM", "ADMIN", "FREELANCER"] as const,
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
