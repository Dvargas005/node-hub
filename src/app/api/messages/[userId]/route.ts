import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { verifyMessageRelationship } from "@/lib/messages-auth";
import { sendEmail } from "@/lib/email";

const MAX_LEN = 2000;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { error, session } = await requireApiRole(["CLIENT", "PM", "ADMIN"]);
  if (error || !session) return error;

  try {
    const { userId: targetId } = await params;
    const viewerId = session.user.id;
    const role = (session.user as Record<string, unknown>).role as string;

    const target = await verifyMessageRelationship(viewerId, role, targetId);
    if (!target) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const messages = await db.directMessage.findMany({
      where: {
        OR: [
          { senderId: viewerId, receiverId: targetId },
          { senderId: targetId, receiverId: viewerId },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return NextResponse.json({
      target: {
        id: target.id,
        name: target.name,
        email: target.email,
        businessName: target.businessName,
        role: target.role,
      },
      messages: messages.map((m: any) => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        read: m.read,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[MESSAGES_GET]", err);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { error, session } = await requireApiRole(["CLIENT", "PM", "ADMIN"]);
  if (error || !session) return error;

  try {
    const { userId: targetId } = await params;
    const viewerId = session.user.id;
    const role = (session.user as Record<string, unknown>).role as string;

    const target = await verifyMessageRelationship(viewerId, role, targetId);
    if (!target) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const body = await req.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }
    if (content.length > MAX_LEN) {
      return NextResponse.json({ error: `Message exceeds ${MAX_LEN} characters` }, { status: 400 });
    }

    const created = await db.directMessage.create({
      data: {
        senderId: viewerId,
        receiverId: targetId,
        content,
      },
    });

    // Notification for receiver
    const senderName = (session.user as Record<string, unknown>).name as string || "N.O.D.E.";
    const link = role === "CLIENT" ? "/admin/messages" : "/messages";
    await db.notification.create({
      data: {
        userId: targetId,
        title: `New message from ${senderName}`,
        message: content.slice(0, 140),
        type: "DIRECT_MESSAGE",
        link,
      },
    });

    // Email — fire and forget (sendEmail itself is non-blocking on missing key)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://node.nouvos.one";
    sendEmail(
      target.email,
      `New message from ${senderName} on N.O.D.E.`,
      `<div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #130A06; margin: 0 0 12px;">New message from ${senderName}</h2>
        <p style="color: #555; line-height: 1.5;">${escapeHtml(content.slice(0, 500))}${content.length > 500 ? "…" : ""}</p>
        <p style="margin-top: 24px;">
          <a href="${baseUrl}${link}" style="background: #FFC919; color: #130A06; text-decoration: none; padding: 12px 24px; font-weight: bold; display: inline-block;">Open conversation</a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">You're receiving this because you have a N.O.D.E. account.</p>
      </div>`,
    );

    return NextResponse.json({
      message: {
        id: created.id,
        senderId: created.senderId,
        receiverId: created.receiverId,
        content: created.content,
        read: created.read,
        createdAt: created.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[MESSAGES_POST]", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
