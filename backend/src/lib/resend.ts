import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${FRONTEND_URL}/verify?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your email — Video Translate",
    html: `
      <p>Welcome! Click below to verify your email and activate your account.</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link expires in 1 hour.</p>
    `,
  });
}