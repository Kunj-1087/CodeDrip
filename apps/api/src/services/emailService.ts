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
    subject: `Deployment Successful — ${orderNumber} | CodeDrip`,
    text: `Your order ${orderNumber} has been deployed! Total charged: ${currency} ${total}. We'll email you tracking when it ships.`,
    html: `<h2>Deployment Successful 🚀</h2>
           <p>Your order <strong>${orderNumber}</strong> has been deployed to production.</p>
           <p>Total charged: <strong>${currency} ${total}</strong></p>
           <p>We'll send tracking information as soon as your threads ship.</p>`,
  };
}

export function adminNewOrderAlertEmail(
  orderNumber: string,
  customerEmail: string,
  total: string,
  currency: string,
  siteUrl: string,
) {
  return {
    subject: `[New Deployment] ${orderNumber} — ${currency} ${total}`,
    text: `New deployment received:\n\nOrder: ${orderNumber}\nCustomer: ${customerEmail}\nTotal: ${currency} ${total}\n\nView in admin: ${siteUrl}/admin/orders`,
    html: `<h2>New deployment 🚀</h2>
           <p><strong>Order:</strong> ${orderNumber}</p>
           <p><strong>Customer:</strong> ${customerEmail}</p>
           <p><strong>Total:</strong> ${currency} ${total}</p>
           <p><a href="${siteUrl}/admin/orders">View in admin dashboard</a></p>`,
  };
}

export function shippingUpdateEmail(orderNumber: string, trackingLink?: string, siteUrl?: string) {
  const trackingHtml = trackingLink
    ? `<p><a href="${trackingLink}">Track your shipment</a></p>`
    : '';
  return {
    subject: `Your CodeDrip order ${orderNumber} is en route`,
    text: `Good news! Your CodeDrip order ${orderNumber} is on its way.${trackingLink ? `\nTrack: ${trackingLink}` : ''}`,
    html: `<h2>Your threads are shipping! 📦</h2>
           <p>Good news! <strong>${orderNumber}</strong> has shipped.</p>
           ${trackingHtml}
           <p><a href="${siteUrl || ''}/orders">View your orders</a></p>`,
  };
}

export function passwordResetEmail(resetUrl: string) {
  return {
    subject: 'Password reset request — CodeDrip',
    text: `Reset your CodeDrip password using this link (valid for 30 minutes): ${resetUrl}`,
    html: `<p>We received a request to reset your CodeDrip password.</p>
           <p><a href="${resetUrl}">Choose a new password</a> — this link is valid for 30 minutes.</p>
           <p>If you didn't request this, you can safely ignore this email.</p>`,
  };
}
