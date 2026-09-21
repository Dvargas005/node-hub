import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "N.O.D.E. <noreply@mail.nodedev.one>";

export function sendEmail(to: string, subject: string, html: string) {
  const resend = getResend();
  if (!resend) return;
  // Resend reports API failures (unverified sender domain, bad recipient, rate
  // limit) in the resolved `{ error }` rather than by rejecting, so a .catch()
  // alone silently drops them. .catch() still covers network failures.
  resend.emails
    .send({ from: FROM_EMAIL, to, subject, html })
    .then(({ error }) => {
      if (error) console.error("[EMAIL] Failed:", subject, "→", to, error);
    })
    .catch((err: unknown) => {
      console.error("[EMAIL] Failed:", subject, "→", to, err);
    });
}
