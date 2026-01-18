import { Resend } from "resend";

export async function sendEmail({
  email,
  subject,
  react,
  html,
  text,
}: {
  email: string;
  subject: string;
  react?: React.ReactNode;
  html?: string;
  text?: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY!);

  const response = await resend.emails.send({
    from: "GAIAAI <noreply@gaia-ai.app>",
    to: [email],
    subject,
    html,
    react,
    text,
  });
  return response;
}
