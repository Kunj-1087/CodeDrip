import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Privacy Policy | CodeDrip',
  description: 'How CodeDrip collects, uses, and protects your personal data when you use our marketplace.',
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
  openGraph: {
    title: 'Privacy Policy | CodeDrip',
    description: 'How CodeDrip collects, uses, and protects your personal data when you use our marketplace.',
    url: `${SITE_URL}/privacy-policy`,
    siteName: 'CodeDrip',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | CodeDrip',
    description: 'How CodeDrip collects, uses, and protects your personal data when you use our marketplace.',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="19 June 2026">
      <p>
        CodeDrip values your privacy. This policy explains what information we collect, why we collect it, and how we
        protect your data when you use our marketplace.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><strong>Account information:</strong> Name, email address, and password when you create an account.</li>
        <li><strong>Order information:</strong> Shipping address, phone number, and order history when you make a purchase.</li>
        <li><strong>Device &amp; browsing data:</strong> IP address, browser type, pages visited, and referral source via cookies and analytics tools.</li>
        <li><strong>Communication data:</strong> Messages you send us via contact forms or email.</li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>Process and fulfill your orders.</li>
        <li>Send order confirmations and shipping updates.</li>
        <li>Improve our website, product catalog, and user experience.</li>
        <li>Send occasional marketing emails (only with your consent — you can unsubscribe anytime).</li>
        <li>Prevent fraud and enforce our terms of service.</li>
      </ul>

      <h2>3. Cookies &amp; local storage</h2>
      <p>
        We use cookies and local storage to keep you signed in, remember your cart contents, save your wishlist items,
        and analyze site traffic. You can disable cookies in your browser settings, but some features may not work
        correctly.
      </p>

      <h2>4. Third-party services</h2>
      <p>
        We use trusted third-party providers for payment processing and analytics. These providers have their own
        privacy policies and only receive the data necessary to perform their services.
      </p>

      <h2>5. Data retention</h2>
      <p>
        We retain your personal data for as long as your account is active or as needed to provide you with services.
        You may request deletion of your data by contacting us at the email below.
      </p>

      <h2>6. Your rights</h2>
      <p>
        You have the right to access, correct, or delete your personal data at any time. To exercise these rights,
        contact us at hello@codedrip.dev.
      </p>

      <h2>7. Contact</h2>
      <p>
        For questions about this privacy policy, email us at <strong>hello@codedrip.dev</strong>.
      </p>
    </LegalPage>
  );
}
