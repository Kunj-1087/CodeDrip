import type { ReactNode } from 'react';

// Shared shell for policy pages: consistent heading, "last updated" line, and a
// token-styled prose area. Keeps Terms/Privacy/Returns visually identical.
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="container-px py-12 md:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-faint">Last updated: {updated}</p>
      <div className="prose-legal mt-8">{children}</div>
    </div>
  );
}
