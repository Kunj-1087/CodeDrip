import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Press & Media Kit | FocusKit',
  description: 'Download official logos, screenshots, brand guidelines, and media assets for FocusKit.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/press`,
  },
};

export default function PressPage() {
  return (
    <div className="container-px py-12 max-w-4xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-ink tracking-tight">Media & Press Kit</h1>
        <p className="mt-3 text-lg text-muted max-w-xl mx-auto leading-relaxed">
          Official resources, brand guidelines, and high-resolution media assets for FocusKit.
        </p>
      </header>

      <main className="space-y-12">
        {/* Brand Overview */}
        <section className="prose dark:prose-invert max-w-none text-muted leading-relaxed">
          <h2 className="text-2xl font-bold text-ink mb-4">About FocusKit</h2>
          <p>
            FocusKit is a productivity marketplace for students, creators, freelancers, and work-from-home users.
            We curate digital planners, Notion templates, printable stationery, journals, and desk accessories
            designed to help people organize their study, work, money, and daily life. Headquartered in Bengaluru,
            India, FocusKit bridges the gap between digital productivity tools and physical desk essentials.
          </p>
        </section>

        {/* Media Asset Blocks */}
        <section className="border-t border-border pt-10">
          <h2 className="text-2xl font-bold text-ink mb-6">Logo Assets</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="card p-6 flex flex-col justify-between border border-border bg-surface">
              <div>
                <h3 className="font-bold text-ink mb-2">Vector Logo (SVG)</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Best for high-resolution print, scaling, and digital displays. Includes full color, dark, and light variants.
                </p>
              </div>
              <div className="mt-6">
                <a
                  href="/favicon.svg"
                  download
                  className="btn-secondary py-2 px-4 rounded-lg text-xs font-semibold inline-block hover:scale-[1.01] transition-transform"
                >
                  Download SVG
                </a>
              </div>
            </div>

            <div className="card p-6 flex flex-col justify-between border border-border bg-surface">
              <div>
                <h3 className="font-bold text-ink mb-2">High-Res PNG Pack</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Transparent raster logo package. Ideal for websites, presentations, and blog post articles.
                </p>
              </div>
              <div className="mt-6">
                <a
                  href="/favicon.svg"
                  download
                  className="btn-secondary py-2 px-4 rounded-lg text-xs font-semibold inline-block hover:scale-[1.01] transition-transform"
                >
                  Download PNG Bundle
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Press Releases / Backgrounders */}
        <section className="border-t border-border pt-10">
          <h2 className="text-2xl font-bold text-ink mb-6">Backgrounders & Press Releases</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border bg-surface-2 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-ink text-sm">FocusKit Company Backgrounder</h3>
                <p className="text-xs text-muted mt-0.5">PDF Document · 1.2 MB</p>
              </div>
              <a
                href="mailto:press@focuskit.in?subject=Requesting Company Backgrounder"
                className="text-xs font-bold text-primary hover:underline"
              >
                Request PDF
              </a>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface-2 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-ink text-sm">Launch Press Release - June 2026</h3>
                <p className="text-xs text-muted mt-0.5">DOCX Document · 850 KB</p>
              </div>
              <a
                href="mailto:press@focuskit.in?subject=Requesting Launch Press Release"
                className="text-xs font-bold text-primary hover:underline"
              >
                Request DOCX
              </a>
            </div>
          </div>
        </section>

        {/* Contact info */}
        <section className="p-6 rounded-2xl bg-primary-light border border-border text-center">
          <h3 className="font-bold text-ink text-lg mb-1">For Press & Media Inquiries</h3>
          <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
            For interviews, product review samples, or quotes from the founders, please reach out to our communications team.
          </p>
          <a
            href="mailto:press@focuskit.in"
            className="mt-4 inline-block text-xs font-bold text-primary hover:underline"
          >
            press@focuskit.in
          </a>
        </section>
      </main>
    </div>
  );
}
