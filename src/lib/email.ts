import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "N.O.D.E. <noreply@node.nouvos.one>";

export function sendEmail(to: string, subject: string, html: string) {
  const resend = getResend();
  if (!resend) return;
  resend.emails.send({ from: FROM_EMAIL, to, subject, html }).catch((err: any) => {
    console.error("[EMAIL] Failed:", subject, "→", to, err);
  });
}
