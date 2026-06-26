import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planner Finder Quiz | FocusKit',
  description: 'Not sure which planner or template fits your workflow? Answer three quick questions and get a personalised recommendation.',
};

export default function PlannerFinderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
