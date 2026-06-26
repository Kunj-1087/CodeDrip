'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';

const SOCIAL_ICONS: Record<string, JSX.Element> = {
  github: <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.1.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.59.69.48A10 10 0 0 0 12 2z" />,
  twitter: <path d="M18.9 2H22l-7.5 8.6L23 22h-6.8l-5.3-7-6.1 7H1.7l8-9.2L1 2h7l4.8 6.4L18.9 2zm-2.4 18h1.9L7.6 4H5.6l10.9 16z" />,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.5" cy="6.5" r="1.2" /></>,
  youtube: <path d="M23 12s0-3.1-.4-4.6a2.4 2.4 0 0 0-1.7-1.7C19.4 5.3 12 5.3 12 5.3s-7.4 0-8.9.4A2.4 2.4 0 0 0 1.4 7.4C1 8.9 1 12 1 12s0 3.1.4 4.6a2.4 2.4 0 0 0 1.7 1.7c1.5.4 8.9.4 8.9.4s7.4 0 8.9-.4a2.4 2.4 0 0 0 1.7-1.7c.4-1.5.4-4.6.4-4.6zM9.8 15.3V8.7l6.2 3.3-6.2 3.3z" />,
  facebook: <path d="M22 12a10 10 0 1 0-11.56 9.88v-7H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v7A10 10 0 0 0 22 12z" />,
};

function SocialLink({ platform, href }: { platform: string; href: string }) {
  const icon = SOCIAL_ICONS[platform];
  if (!icon) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={platform}
      className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-muted transition-colors hover:border-primary hover:text-primary active:scale-95 bg-black/20"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        {icon}
      </svg>
    </a>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string; external?: boolean }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 md:border-b-0 py-2.5 md:py-0">
      {/* Mobile Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left md:hidden select-none cursor-pointer py-2 focus:outline-none"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-faint font-mono">{title}</span>
        <svg
          className={cn("h-4 w-4 text-primary transition-transform duration-200", isOpen ? "rotate-180" : "")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Desktop Heading */}
      <p className="hidden md:block mb-3 text-xs font-semibold uppercase tracking-wider text-faint font-mono">{title}</p>

      {/* Links List */}
      <ul className={cn(
        "space-y-1.5 text-xs font-mono transition-all duration-200 mt-2 md:mt-0",
        isOpen ? "block animate-fade-in" : "hidden md:block"
      )}>
        {links.map((l) =>
          l.external ? (
            <li key={l.label}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-muted transition-colors hover:text-ink">{l.label}</a>
            </li>
          ) : (
            <li key={l.label}>
              <Link href={l.href} className="text-muted transition-colors hover:text-ink">{l.label}</Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

export function Footer() {
  const { settings } = useStore();
  const { notify } = useToast();
  const [email, setEmail] = useState('');

  const name = settings?.storeName ?? 'CodeDrip';
  const social = settings?.socialLinks ?? {};
  const supportEmail = settings?.supportEmail;

  const shopLinks = [
    { label: '/shop', href: '/shop' },
    { label: 'T-Shirts', href: '/shop?category=developer-t-shirts' },
    { label: 'Limited Drops', href: '/shop?category=limited-drops' },
    { label: 'Hoodies', href: '/shop?category=hoodies-outerwear' },
  ];
  const supportLinks = [
    { label: 'Contact / File an issue', href: '/contact' },
    { label: 'man faq', href: '/faq' },
    { label: 'Shipping & Returns', href: '/refund-policy' },
    { label: 'git log (orders)', href: '/orders' },
    ...(supportEmail ? [{ label: supportEmail, href: `mailto:${supportEmail}`, external: true }] : []),
  ];
  const companyLinks = [
    { label: 'README.md', href: '/about' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms-of-service' },
    { label: 'Refund Policy', href: '/refund-policy' },
    { label: 'Shipping Policy', href: '/shipping-policy' },
  ];
  const accountLinks = [
    { label: 'Authenticate', href: '/auth/login' },
    { label: 'Register', href: '/auth/register' },
    { label: '~/profile', href: '/profile' },
    { label: '~/orders', href: '/orders' },
  ];

  return (
    <footer className="mt-20 border-t border-white/5 bg-[#0D0D11] text-ink relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-44 w-44 rounded-full bg-primary/5 blur-[80px]" />
      
      <div className="container-px grid gap-8 py-10 md:py-12 grid-cols-1 md:grid-cols-3 lg:grid-cols-6 relative z-10">
        <div className="flex flex-col items-center text-center md:items-start md:text-left lg:pr-8 md:col-span-3 lg:col-span-2">
          <div className="flex justify-center md:justify-start w-full">
            <Logo size="md" />
          </div>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted font-sans text-center md:text-left">
            Witty, clever, and uncomfortably relatable premium developer t-shirts. Engineered for coders who like their humor compiled.
          </p>

          <p className="mt-4 text-xs font-mono font-bold text-white uppercase tracking-wider text-center md:text-left">changelog.subscribe()</p>
          <p className="text-[10px] text-muted font-mono mt-1 text-center md:text-left">Get discount API keys and announcements.</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setEmail('');
              notify('Subscribed! You\'ll receive API keys and drop notifications.', 'success');
            }}
            className="mt-2.5 flex w-full max-w-sm gap-2"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@email.com"
              aria-label="Email address"
              className="w-full h-10 rounded-lg border border-white/5 bg-black/25 px-3 text-xs text-white focus:border-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/10 font-mono transition-all"
            />
            <button type="submit" className="btn bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white px-4 h-10 flex items-center justify-center text-xs font-mono rounded-lg shadow-md transition-all active:scale-[0.98]">
              Verify
            </button>
          </form>

          {Object.keys(social).length > 0 && (
            <div className="mt-4 flex justify-center md:justify-start gap-3 w-full">
              {Object.entries(social).map(([platform, href]) => (
                <SocialLink key={platform} platform={platform} href={href} />
              ))}
            </div>
          )}
        </div>

        <FooterCol title="Shop" links={shopLinks} />
        <FooterCol title="Support" links={supportLinks} />
        <FooterCol title="Company" links={companyLinks} />
        <FooterCol title="Account" links={accountLinks} />
      </div>

      <div className="border-t border-white/5 bg-black/10">
        <div className="container-px flex flex-col items-center gap-2 py-4 text-[10px] text-faint sm:flex-row sm:justify-between font-mono">
          <p>© {new Date().getFullYear()} {name}. All rights reserved.</p>
          <nav className="flex items-center gap-4" aria-label="Legal">
            <Link href="/terms-of-service" className="transition-colors hover:text-white">~/terms</Link>
            <Link href="/privacy-policy" className="transition-colors hover:text-white">~/privacy</Link>
            <Link href="/refund-policy" className="transition-colors hover:text-white">~/returns</Link>
            <Link href="/contact" className="transition-colors hover:text-white">~/contact</Link>
          </nav>
          <p>system.deploy(country: "India")</p>
        </div>
      </div>
      
      {/* Hidden Easter Egg comment requested in specifications */}
      <div dangerouslySetInnerHTML={{ __html: '<!-- Built with ❤️ and lots of ☕ -->' }} />
    </footer>
  );
}
