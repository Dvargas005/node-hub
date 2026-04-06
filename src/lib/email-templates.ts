const base = "font-family:'Helvetica Neue',Arial,sans-serif;background-color:#130A06;color:#F5F6FC;padding:40px;";
const btn = "display:inline-block;background-color:#FFC919;color:#130A06;padding:12px 24px;text-decoration:none;font-weight:bold;";
const foot = '<p style="margin-top:30px;opacity:0.6;font-size:12px;">N.O.D.E. — Powered by Nouvos</p>';
const APP = "https://node.nouvos.one";

function wrap(title: string, body: string, link: string, linkText: string) {
  return `<div style="${base}"><h1 style="color:#FFC919;">${title}</h1>${body}<a href="${APP}${link}" style="${btn}">${linkText}</a>${foot}</div>`;
}

export function welcomeEmail(name: string) {
  return { subject: "Welcome to N.O.D.E.!", html: wrap("Hi, " + name + "!", "<p>Your N.O.D.E. account has been created. You have 10 free credits to explore the platform.</p><p>Set up your business profile and discover everything we can do for your business.</p>", "/dashboard", "Go to my dashboard →") };
}

export function ticketCreatedEmail(name: string, num: number, svc: string) {
  return { subject: `Request #${num} received — ${svc}`, html: wrap("Request received", `<p>Hi ${name}, your request <strong>#${num}</strong> for <strong>${svc}</strong> has been created.</p><p>A Project Manager will review your request and reach out soon to confirm the details.</p>`, "/tickets", "View my requests →") };
}

export function ticketAssignedEmail(name: string, num: number) {
  return { subject: `Request #${num} — Specialist assigned`, html: wrap("Your request is underway!", `<p>Hi ${name}, a specialist has been assigned to your request <strong>#${num}</strong>.</p><p>We're working on it. We'll let you know when we have something ready for you.</p>`, "/tickets", "Check status →") };
}

export function deliveryReadyEmail(name: string, num: number, svc: string) {
  return { subject: `Request #${num} — Delivery ready`, html: wrap("Your delivery is ready!", `<p>Hi ${name}, the delivery for <strong>${svc}</strong> (request <strong>#${num}</strong>) is ready for your review.</p><p>Review it and approve, or request adjustments if you need changes.</p>`, "/tickets", "Review delivery →") };
}

export function ticketCompletedEmail(name: string, num: number, svc: string, bonus?: number) {
  const bonusLine = bonus ? `<p style="color:#FFC919;">+${bonus} bonus credits for approving on the first round!</p>` : "";
  return { subject: `Request #${num} completed`, html: wrap("Request completed!", `<p>Hi ${name}, your request <strong>#${num}</strong> (<strong>${svc}</strong>) has been completed.</p>${bonusLine}<p>Ready for your next project?</p>`, "/request", "New request →") };
}

export function subscriptionActiveEmail(name: string, plan: string, credits: number) {
  return { subject: `${plan} plan activated — ${credits} credits available`, html: wrap("Your plan is active!", `<p>Hi ${name}, your <strong>${plan}</strong> plan has been activated. You have <strong>${credits} credits</strong> available.</p><p>Create your first request and put your digital team to work.</p>`, "/request", "Create request →") };
}

export function pmNewTicketEmail(pmName: string, num: number, client: string, svc: string) {
  return { subject: `New ticket #${num} — ${client}`, html: wrap("New ticket assigned", `<p>Hi ${pmName}, client <strong>${client}</strong> created request <strong>#${num}</strong> for <strong>${svc}</strong>.</p><p>Review the brief and assign a freelancer.</p>`, "/admin/tickets", "View tickets →") };
}

export function freelancerNewAssignmentEmail(flName: string, num: number, svc: string) {
  return { subject: `New assignment — Ticket #${num}`, html: wrap("New task assigned", `<p>Hi ${flName}, you've been assigned ticket <strong>#${num}</strong> for <strong>${svc}</strong>.</p><p>Review the brief and your PM's instructions.</p>`, "/freelancer/portal", "View my tickets →") };
}
