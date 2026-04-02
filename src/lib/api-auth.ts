import { auth } from "./auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function requireApiRole(roles: string[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }), session: null };
  }

  const role = (session.user as Record<string, unknown>).role as string;
  if (!roles.includes(role)) {
    return { error: NextResponse.json({ error: "Sin permisos" }, { status: 403 }), session: null };
  }

  return { error: null, session };
}
