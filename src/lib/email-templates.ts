const base = "font-family:'Helvetica Neue',Arial,sans-serif;background-color:#130A06;color:#F5F6FC;padding:40px;";
const btn = "display:inline-block;background-color:#FFC919;color:#130A06;padding:12px 24px;text-decoration:none;font-weight:bold;";
const foot = '<p style="margin-top:30px;opacity:0.6;font-size:12px;">N.O.D.E. — Powered by Nouvos</p>';
const APP = "https://node.nouvos.one";

function wrap(title: string, body: string, link: string, linkText: string) {
  return `<div style="${base}"><h1 style="color:#FFC919;">${title}</h1>${body}<a href="${APP}${link}" style="${btn}">${linkText}</a>${foot}</div>`;
}

export function welcomeEmail(name: string) {
  return { subject: "Bienvenido a N.O.D.E.!", html: wrap("Hola, " + name + "!", "<p>Tu cuenta ha sido creada. Tienes 10 créditos gratis para explorar la plataforma.</p>", "/dashboard", "Ir a mi panel →") };
}

export function ticketCreatedEmail(name: string, num: number, svc: string) {
  return { subject: `Solicitud #${num} recibida — ${svc}`, html: wrap("Solicitud recibida", `<p>Hola ${name}, tu solicitud <strong>#${num}</strong> para <strong>${svc}</strong> ha sido creada. Un PM la revisará pronto.</p>`, "/tickets", "Ver mis solicitudes →") };
}

export function ticketAssignedEmail(name: string, num: number) {
  return { subject: `Solicitud #${num} — Especialista asignado`, html: wrap("Tu solicitud está en marcha!", `<p>Hola ${name}, un especialista ha sido asignado a tu solicitud <strong>#${num}</strong>.</p>`, "/tickets", "Ver estado →") };
}

export function deliveryReadyEmail(name: string, num: number, svc: string) {
  return { subject: `Solicitud #${num} — Entrega lista`, html: wrap("Tu entrega está lista!", `<p>Hola ${name}, la entrega de <strong>${svc}</strong> (#${num}) está lista para tu revisión.</p>`, "/tickets", "Revisar entrega →") };
}

export function ticketCompletedEmail(name: string, num: number, svc: string, bonus?: number) {
  const bonusLine = bonus ? `<p style="color:#FFC919;">🎁 +${bonus} créditos bonus por aprobar en primera ronda!</p>` : "";
  return { subject: `Solicitud #${num} completada`, html: wrap("Solicitud completada!", `<p>Hola ${name}, tu solicitud <strong>#${num}</strong> (<strong>${svc}</strong>) ha sido completada.</p>${bonusLine}`, "/request", "Nueva solicitud →") };
}

export function subscriptionActiveEmail(name: string, plan: string, credits: number) {
  return { subject: `Plan ${plan} activado — ${credits} créditos`, html: wrap("Tu plan está activo!", `<p>Hola ${name}, tu plan <strong>${plan}</strong> está activo. Tienes <strong>${credits} créditos</strong> disponibles.</p>`, "/request", "Crear solicitud →") };
}

export function pmNewTicketEmail(pmName: string, num: number, client: string, svc: string) {
  return { subject: `Nuevo ticket #${num} — ${client}`, html: wrap("Nuevo ticket", `<p>Hola ${pmName}, el cliente <strong>${client}</strong> creó la solicitud <strong>#${num}</strong> para <strong>${svc}</strong>.</p>`, "/admin/tickets", "Ver tickets →") };
}

export function freelancerNewAssignmentEmail(flName: string, num: number, svc: string) {
  return { subject: `Nueva asignación — Ticket #${num}`, html: wrap("Nueva tarea", `<p>Hola ${flName}, se te asignó el ticket <strong>#${num}</strong> para <strong>${svc}</strong>.</p>`, "/freelancer/portal", "Ver mis tickets →") };
}
