import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { sendEmail } from "@/lib/email";
import { ticketAssignedEmail, freelancerNewAssignmentEmail } from "@/lib/email-templates";
import { t, DEFAULT_LANG } from "@/lib/i18n";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireApiRole(["ADMIN", "PM"]);
  if (error) return error;

  const lang = req.cookies.get("node-language")?.value || DEFAULT_LANG;

  try {
    const { freelancerId } = await req.json();
    const ticketId = params.id;

    // C13: Atomic assignment with WHERE condition to prevent TOCTOU
    await db.$transaction(async (tx: any) => {
      // Use updateMany with WHERE freelancerId IS NULL for atomicity
      const updated = await tx.ticket.updateMany({
        where: { id: ticketId, freelancerId: null, status: { in: ["NEW", "REVIEWING"] } },
        data: { freelancerId, status: "ASSIGNED", assignedAt: new Date() },
      });

      if (updated.count === 0) {
        // Either ticket doesn't exist or already assigned
        const exists = await tx.ticket.findUnique({ where: { id: ticketId } });
        if (!exists) throw new Error("NOT_FOUND");
        throw new Error("ALREADY_ASSIGNED");
      }

      // Verify freelancer exists and is available
      const freelancer = await tx.freelancer.findUnique({ where: { id: freelancerId } });
      if (!freelancer) throw new Error("FREELANCER_NOT_FOUND");
      if (freelancer.availability !== "AVAILABLE") throw new Error("FREELANCER_UNAVAILABLE");

      const updatedFreelancer = await tx.freelancer.update({
        where: { id: freelancerId },
        data: { currentLoad: { increment: 1 } },
      });

      if (updatedFreelancer.currentLoad >= updatedFreelancer.clientCapacity) {
        await tx.freelancer.update({
          where: { id: freelancerId },
          data: { availability: "BUSY" },
        });
      }
    });

    const updatedTicket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { name: true, email: true } },
        variant: { include: { service: { select: { name: true } } } },
        freelancer: { select: { name: true, email: true } },
      },
    });

    if (updatedTicket) {
      const clientTpl = ticketAssignedEmail(updatedTicket.user.name, updatedTicket.number);
      sendEmail(updatedTicket.user.email || "", clientTpl.subject, clientTpl.html);
      if (updatedTicket.freelancer) {
        const flTpl = freelancerNewAssignmentEmail(updatedTicket.freelancer.name, updatedTicket.number, updatedTicket.variant.service.name);
        sendEmail(updatedTicket.freelancer.email || "", flTpl.subject, flTpl.html);
      }
    }

    return NextResponse.json(updatedTicket);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") {
      return NextResponse.json({ error: t("api.error.ticketNotFound", lang) }, { status: 404 });
    }
    if (msg === "ALREADY_ASSIGNED") {
      return NextResponse.json({ error: "Este ticket ya fue asignado" }, { status: 400 });
    }
    if (msg === "FREELANCER_NOT_FOUND") {
      return NextResponse.json({ error: "Freelancer no encontrado" }, { status: 404 });
    }
    if (msg === "FREELANCER_UNAVAILABLE") {
      return NextResponse.json({ error: "Este freelancer no está disponible" }, { status: 400 });
    }
    console.error("[ASSIGN_TICKET]", err);
    return NextResponse.json(
      { error: t("api.error.internal", lang) },
      { status: 500 }
    );
  }
}
