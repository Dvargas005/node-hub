import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT", "ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const { briefStructured, conversationMessages, variantId } = await req.json();

    if (!variantId || !briefStructured) {
      return NextResponse.json(
        { error: "Datos del brief incompletos" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Validate variant exists
    const variant = await db.serviceVariant.findUnique({
      where: { id: variantId },
      include: { service: true },
    });

    if (!variant) {
      return NextResponse.json(
        { error: "Variante de servicio no encontrada" },
        { status: 404 }
      );
    }

    // Validate subscription and credits
    const subscription = await db.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription || subscription.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Necesitas un plan activo para crear solicitudes" },
        { status: 400 }
      );
    }

    if (subscription.creditsRemaining < variant.creditCost) {
      return NextResponse.json(
        {
          error: `No tienes suficientes créditos. Necesitas ${variant.creditCost}, tienes ${subscription.creditsRemaining}.`,
        },
        { status: 400 }
      );
    }

    // Check min plan
    if (variant.minPlan) {
      const planOrder = ["member", "growth", "pro"];
      const userPlanIndex = planOrder.indexOf(subscription.plan.slug);
      const minPlanIndex = planOrder.indexOf(variant.minPlan);
      if (userPlanIndex < minPlanIndex) {
        return NextResponse.json(
          { error: `Esta variante requiere el plan ${variant.minPlan} o superior` },
          { status: 400 }
        );
      }
    }

    // Atomic transaction: create ticket + deduct credits + save conversation
    const ticket = await db.$transaction(async (tx) => {
      // Deduct credits
      await tx.subscription.update({
        where: { id: subscription.id },
        data: { creditsRemaining: { decrement: variant.creditCost } },
      });

      // Extract pmAlert if present (invisible to client)
      const pmAlert = briefStructured?.pmAlert || null;

      // Create ticket
      const newTicket = await tx.ticket.create({
        data: {
          userId,
          variantId,
          status: "NEW",
          priority: "NORMAL",
          briefRaw: conversationMessages || [],
          briefStructured,
          creditsCharged: variant.creditCost,
          pmNotes: pmAlert,
        },
      });

      // Save wizard conversation
      await tx.wizardConversation.create({
        data: {
          userId,
          messages: conversationMessages || [],
          suggestedService: variant.service.slug,
          suggestedVariant: variant.id,
          briefGenerated: briefStructured,
          status: "TICKET_CREATED",
        },
      });

      return newTicket;
    });

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        number: ticket.number,
        serviceName: variant.service.name,
        variantName: variant.name,
        creditsCharged: ticket.creditsCharged,
        serviceSlug: variant.service.slug,
      },
    });
  } catch (err) {
    console.error("[WIZARD_CREATE_TICKET]", err);
    return NextResponse.json(
      { error: "Error al crear el ticket" },
      { status: 500 }
    );
  }
}
