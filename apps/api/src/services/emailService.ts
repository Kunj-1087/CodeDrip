// =============================================================================
// Email service. Uses SMTP when configured; otherwise falls back to a console
// "mock" transport so local dev and CI never require a mail server. Password-
// reset tokens are surfaced via this service.
// =============================================================================
import nodemailer from 'nodemailer';
import { env } from '../config/env.ts';

type Transport = nodemailer.Transporter | null;

let transport: Transport = null;
let initialized = false;

function getTransport(): Transport {
  if (initialized) return transport;
  initialized = true;
  if (env.smtp.host && env.smtp.port) {
    transport = nodemailer.createTransport({
      host: env.smtp.host,
      port: Number(env.smtp.port),
      secure: Number(env.smtp.port) === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  } else {
    transport = null; // mock mode
  }
  return transport;
}

export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  const t = getTransport();
  if (!t) {
    // Mock transport: log instead of sending. Keeps dev unblocked.
    // eslint-disable-next-line no-console
    console.log(`\n[email:mock] to=${to}\n  subject: ${subject}\n  ${text ?? html}\n`);
    return { mocked: true };
  }
  await t.sendMail({ from: env.emailFrom, to, subject, html, text });
  return { mocked: false };
}

export function orderConfirmationEmail(orderNumber: string, total: string, currency: string) {
  return {
    subject: `Your OursCart order ${orderNumber} is confirmed`,
    text: `Thanks for your order! ${orderNumber} is confirmed. Total charged: ${currency} ${total}. We'll email you when it ships.`,
    html: `<h2>Order confirmed 🎉</h2>
           <p>Thanks for your order. <strong>${orderNumber}</strong> is confirmed.</p>
           <p>Total charged: <strong>${currency} ${total}</strong></p>
           <p>We'll send tracking as soon as it ships.</p>`,
  };
}

export function passwordResetEmail(resetUrl: string) {
  return {
    subject: 'Reset your OursCart password',
    text: `Reset your password using this link (valid for 30 minutes): ${resetUrl}`,
    html: `<p>We received a request to reset your OursCart password.</p>
           <p><a href="${resetUrl}">Choose a new password</a> — this link is valid for 30 minutes.</p>
           <p>If you didn't request this, you can safely ignore this email.</p>`,
  };
}
