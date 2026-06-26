import type { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'README.md | CodeDrip',
  description: 'Learn about CodeDrip — developer-focused apparel for coders, sysadmins, and tech enthusiasts who wear their stack with pride.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'README.md | CodeDrip',
    description: 'Learn about CodeDrip — developer-focused apparel for coders, sysadmins, and tech enthusiasts who wear their stack with pride.',
    url: `${SITE_URL}/about`,
    siteName: 'CodeDrip',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'README.md | CodeDrip',
    description: 'Learn about CodeDrip — developer-focused apparel for coders, sysadmins, and tech enthusiasts who wear their stack with pride.',
  },
};

export default function AboutPage() {
function AboutPageJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About CodeDrip',
    description: 'Learn about CodeDrip — developer-focused apparel for coders, sysadmins, and tech enthusiasts who wear their stack with pride.',
    url: `${SITE_URL}/about`,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

  return (
    <div className="container-px py-12 max-w-4xl mx-auto">
      <AboutPageJsonLd />
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-ink tracking-tight">About CodeDrip</h1>
        <p className="mt-3 text-lg text-muted max-w-xl mx-auto leading-relaxed">
          Developer apparel for people who write code and break things.
        </p>
      </header>

      <main className="max-w-none space-y-8 leading-relaxed text-muted">
        <section className="space-y-4">
          <p className="text-lg">
            CodeDrip is a developer-first apparel brand built for coders, sysadmins, DevOps engineers, and 
            tech enthusiasts who want their wardrobe to reflect their stack. Every design is inspired by 
            the tools, languages, and inside jokes that define life on the command line.
          </p>
          <p className="text-lg font-medium text-ink">
            Our mission: help you dress like you deploy — with confidence, style, and a touch of terminal aesthetic.
          </p>
        </section>

        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-2xl font-bold text-ink">Our Mission</h2>
          <p>
            We believe that great developers deserve great apparel. Whether you&apos;re debugging at 2 AM, 
            deploying to production on a Friday, or presenting at a conference, CodeDrip has the shirt 
            that speaks your language.
          </p>
          <p>
            Every design is created by developers, for developers. We don&apos;t just print code patterns 
            on fabric — we craft designs that resonate with people who actually write software.
          </p>
        </section>

        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-2xl font-bold text-ink">Who We Serve</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Backend Engineers:</strong> The folks who make the magic happen behind the API.</li>
            <li><strong>Frontend Developers:</strong> Because even UI people need great shirts.</li>
            <li><strong>DevOps &amp; SRE:</strong> For those who keep the servers running at 3 AM.</li>
            <li><strong>Data Scientists &amp; ML Engineers:</strong> Models, training data, and now — great threads.</li>
            <li><strong>Students &amp; Bootcamp Grads:</strong> Represent your stack before you even get the job.</li>
          </ul>
        </section>

        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-2xl font-bold text-ink">What We Offer</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Developer T-Shirts:</strong> Premium cotton tees with witty, clever, and uncomfortably relatable designs.</li>
            <li><strong>Limited Drops:</strong> Small-batch designs that ship before your next merge conflict.</li>
            <li><strong>Hoodies &amp; Outerwear:</strong> For late-night debugging sessions and chilly server rooms.</li>
          </ul>
        </section>

        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="text-2xl font-bold text-ink">Why CodeDrip</h2>
          <p>
            CodeDrip was born from a simple observation: developers love their tools, their languages, and 
            their inside jokes — but there was no apparel brand that truly understood them. Most tech shirts 
            are either generic or designed by people who don&apos;t write code.
          </p>
          <p>
            We changed that. Every CodeDrip design is concepted, tested, and approved by working developers. 
            The result is apparel that makes other coders nod in recognition and say, &quot;I get that reference.&quot;
          </p>
        </section>

        {/* Trust badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          {[
            ['Premium Quality', '100% combed ring-spun cotton. Pre-shrunk. Built to last.'],
            ['Designed by Devs', 'Every graphic is created by developers who actually write code.'],
            ['Free Shipping', 'Free shipping across India on orders above ₹999.'],
            ['Easy Returns', '7-day return policy. No questions asked if unworn.'],
          ].map(([title, desc]) => (
            <div key={title} className="card p-4 text-center">
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="mt-1 text-xs text-muted">{desc}</p>
            </div>
          ))}
        </div>

        <section className="mt-8 p-6 rounded-2xl bg-surface-2 border border-border flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-bold text-ink text-lg">Ready to rep your stack?</h3>
            <p className="text-sm text-muted mt-1">Browse our collection of developer t-shirts, hoodies, and limited drops.</p>
          </div>
          <Link href="/shop" className="btn-primary py-2.5 px-5 rounded-lg whitespace-nowrap text-sm font-semibold">
            git checkout shop/
          </Link>
        </section>
      </main>
    </div>
  );
}
