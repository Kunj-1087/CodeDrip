import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Productivity Tools & Resources | FocusKit',
  description: 'Free interactive tools, planners, and resources to help students and creators organize their study, work, and daily life.',
};

export default function ToolsIndexPage() {
  return (
    <div className="container-px py-12 max-w-6xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-ink tracking-tight">
          Productivity Tools
        </h1>
        <p className="mt-4 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
          Free interactive tools designed to help students, freelancers, and creators find the right productivity system for their needs.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Tool Card 1: Planner Finder */}
        <div className="group rounded-2xl border border-border bg-surface hover:border-primary hover:shadow-lg transition-all duration-300 p-6 flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 rounded-xl bg-primary-light flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">Planner Finder Quiz</h2>
            <p className="text-sm text-muted leading-relaxed">
              Not sure which planner or template fits your workflow? Answer a few quick questions and get a personalised recommendation.
            </p>
          </div>
          <div className="mt-8">
            <Link
              href="/tools/planner-finder"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:underline"
            >
              Find Your Planner
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Tool Card 2: Study Schedule Builder */}
        <div className="group rounded-2xl border border-border bg-surface-2 opacity-75 p-6 flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 rounded-xl bg-surface-3 flex items-center justify-center text-muted mb-5">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">Study Schedule Builder</h2>
            <p className="text-sm text-muted leading-relaxed">
              Create a personalised weekly study timetable based on your courses, deadlines, and free hours. Optimise your semester.
            </p>
          </div>
          <div className="mt-8 text-xs font-semibold text-muted tracking-wider uppercase">
            Coming Soon
          </div>
        </div>

        {/* Tool Card 3: Budget Calculator */}
        <div className="group rounded-2xl border border-border bg-surface-2 opacity-75 p-6 flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 rounded-xl bg-surface-3 flex items-center justify-center text-muted mb-5">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">Student Budget Calculator</h2>
            <p className="text-sm text-muted leading-relaxed">
              Plan your monthly income, track expenses, and see where your money goes. Built for students managing limited budgets.
            </p>
          </div>
          <div className="mt-8 text-xs font-semibold text-muted tracking-wider uppercase">
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}
