'use client';

import { useState } from 'react';
import Link from 'next/link';

type WorkStyle = 'structured' | 'visual' | 'minimal' | 'detailed';
type ProductType = 'digital' | 'physical' | 'printable' | 'bundle';
type UseCase = 'study' | 'work' | 'budget' | 'habits';

interface Recommendation {
  title: string;
  slug: string;
  description: string;
  badge: string;
}

const ALL_RECOMMENDATIONS: Record<string, Recommendation> = {
  'notion-student-dashboard': {
    title: 'Notion Student Dashboard',
    slug: '/shop/notion-student-dashboard',
    description: 'Perfect for structured students who want to organize classes, assignments, and exams in one place.',
    badge: 'Notion Template',
  },
  'notion-life-planner': {
    title: 'Notion Life Planner',
    slug: '/shop/notion-life-planner',
    description: 'Ideal for visual planners who want a comprehensive workspace for tasks, habits, and goals.',
    badge: 'Notion Template',
  },
  'adhd-daily-planner-printable': {
    title: 'ADHD Daily Planner Printable',
    slug: '/shop/adhd-daily-planner-printable',
    description: 'Built for minimalists who need a simple, focused daily planning system.',
    badge: 'Printable PDF',
  },
  'habit-tracker-printable-bundle': {
    title: 'Habit Tracker Printable Bundle',
    slug: '/shop/habit-tracker-printable-bundle',
    description: 'Great for detail-oriented people who want to track multiple habits and routines.',
    badge: 'Printable PDF',
  },
  'productivity-journal': {
    title: 'Productivity Journal',
    slug: '/shop/productivity-journal',
    description: 'A physical journal for structured daily focus, priorities, and reflection.',
    badge: 'Print-on-Demand',
  },
  'student-planner-notebook': {
    title: 'Student Planner Notebook',
    slug: '/shop/student-planner-notebook',
    description: 'A detailed physical notebook for students who prefer pen-and-paper planning.',
    badge: 'Print-on-Demand',
  },
  'budget-planner-spreadsheet': {
    title: 'Budget Planner Spreadsheet',
    slug: '/shop/budget-planner-spreadsheet',
    description: 'Perfect for tracking income, expenses, and savings goals in a structured format.',
    badge: 'Spreadsheet',
  },
  'student-starter-kit': {
    title: 'Student Starter Kit',
    slug: '/shop/student-starter-kit',
    description: 'The complete bundle for students — digital dashboard, habit tracker, and physical notebook.',
    badge: 'Bundle',
  },
  'weekly-desk-planner-pad': {
    title: 'Weekly Desk Planner Pad',
    slug: '/shop/weekly-desk-planner-pad',
    description: 'A minimalist physical pad for mapping out your week at a glance.',
    badge: 'Stationery',
  },
  'desk-reset-kit': {
    title: 'Desk Reset Kit',
    slug: '/shop/desk-reset-kit',
    description: 'Transform your workspace with cable management, phone stand, and cleaning kit.',
    badge: 'Bundle',
  },
};

function findRecommendations(workStyle: WorkStyle, productType: ProductType, useCase: UseCase): Recommendation[] {
  const slugs: string[] = [];

  if (useCase === 'study') {
    if (workStyle === 'structured') slugs.push('notion-student-dashboard', 'student-planner-notebook');
    else if (workStyle === 'visual') slugs.push('notion-student-dashboard', 'weekly-desk-planner-pad');
    else if (workStyle === 'minimal') slugs.push('adhd-daily-planner-printable', 'weekly-desk-planner-pad');
    else slugs.push('student-planner-notebook', 'habit-tracker-printable-bundle');
  } else if (useCase === 'work') {
    if (productType === 'physical') slugs.push('productivity-journal', 'desk-reset-kit');
    else slugs.push('notion-life-planner', 'student-starter-kit');
  } else if (useCase === 'budget') {
    slugs.push('budget-planner-spreadsheet', 'notion-life-planner');
  } else {
    slugs.push('habit-tracker-printable-bundle', 'adhd-daily-planner-printable');
  }

  if (useCase === 'study') slugs.push('student-starter-kit');
  else if (useCase === 'work' && productType === 'physical') slugs.push('desk-reset-kit');

  return slugs
    .map((s) => ALL_RECOMMENDATIONS[s])
    .filter(Boolean)
    .slice(0, 3);
}

export default function PlannerFinderPage() {
  const [step, setStep] = useState(0);
  const [workStyle, setWorkStyle] = useState<WorkStyle | null>(null);
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [useCase, setUseCase] = useState<UseCase | null>(null);
  const [results, setResults] = useState<Recommendation[]>([]);

  const handleAnswer = (answer: string) => {
    if (step === 0) {
      setWorkStyle(answer as WorkStyle);
      setStep(1);
    } else if (step === 1) {
      setUseCase(answer as UseCase);
      setStep(2);
    } else if (step === 2) {
      setProductType(answer as ProductType);
      const recs = findRecommendations(
        (workStyle || 'structured') as WorkStyle,
        answer as ProductType,
        (useCase || 'study') as UseCase,
      );
      setResults(recs);
      setStep(3);
    }
  };

  const reset = () => {
    setStep(0);
    setWorkStyle(null);
    setProductType(null);
    setUseCase(null);
    setResults([]);
  };

  return (
    <div className="container-px py-10 max-w-3xl mx-auto">
      <header className="mb-10 text-center">
        <span className="text-xs uppercase font-bold tracking-wider text-primary bg-primary-light px-3 py-1 rounded-full">
          Free Tool
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink mt-3 tracking-tight">
          Planner Finder Quiz
        </h1>
        <p className="mt-3 text-muted max-w-xl mx-auto leading-relaxed text-sm">
          Not sure which planner or template fits your workflow? Answer three quick questions and get a personalised recommendation in seconds.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="flex gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                step > i ? 'bg-primary' : step === i ? 'bg-primary/50' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-ink mb-2">How do you like to plan?</h2>
            <p className="text-sm text-muted mb-6">Choose the style that fits you best.</p>
            <div className="grid gap-3">
              {[
                { value: 'structured', label: 'Structured & organised', desc: 'I love schedules, deadlines, and checklists.' },
                { value: 'visual', label: 'Visual & creative', desc: 'I prefer boards, colours, and seeing the big picture.' },
                { value: 'minimal', label: 'Simple & minimal', desc: 'I want the essentials — nothing more.' },
                { value: 'detailed', label: 'Detailed & thorough', desc: 'I track everything in fine detail.' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className="text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary-light/20 transition-all group"
                >
                  <span className="font-semibold text-ink group-hover:text-primary transition-colors">{opt.label}</span>
                  <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-ink mb-2">What do you need to organise?</h2>
            <p className="text-sm text-muted mb-6">Pick your main focus area.</p>
            <div className="grid gap-3">
              {[
                { value: 'study', label: '📚 Study & classes', desc: 'Courses, assignments, exams, and semester planning.' },
                { value: 'work', label: '💼 Work & freelancing', desc: 'Projects, clients, invoices, and content.' },
                { value: 'budget', label: '💰 Budget & finance', desc: 'Income, expenses, savings, and money goals.' },
                { value: 'habits', label: '🎯 Habits & routines', desc: 'Daily habits, wellness, and personal growth.' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className="text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary-light/20 transition-all group"
                >
                  <span className="font-semibold text-ink group-hover:text-primary transition-colors">{opt.label}</span>
                  <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-ink mb-2">Digital or physical?</h2>
            <p className="text-sm text-muted mb-6">How do you prefer to work?</p>
            <div className="grid gap-3">
              {[
                { value: 'digital', label: '💻 Digital tools', desc: 'Notion templates, spreadsheets, Canva — all online.' },
                { value: 'printable', label: '🖨️ Printable PDFs', desc: 'Download, print, and write by hand.' },
                { value: 'physical', label: '📓 Physical products', desc: 'Journals, notebooks, planners, and desk accessories.' },
                { value: 'bundle', label: '🎁 Bundles & kits', desc: 'A mix of everything — show me the best value.' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className="text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary-light/20 transition-all group"
                >
                  <span className="font-semibold text-ink group-hover:text-primary transition-colors">{opt.label}</span>
                  <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-success flex items-center justify-center text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-ink">Your personalised picks</h2>
                <p className="text-xs text-muted">Based on your answers, we recommend:</p>
              </div>
            </div>

            <div className="space-y-4">
              {results.map((rec, i) => (
                <Link
                  key={rec.slug}
                  href={rec.slug}
                  className="block p-5 rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-ink group-hover:text-primary transition-colors">
                          {i + 1}. {rec.title}
                        </span>
                      </div>
                      <p className="text-sm text-muted leading-relaxed">{rec.description}</p>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-primary-light text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                      {rec.badge}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={reset} className="btn-secondary flex-1 py-2.5 rounded-lg text-sm font-semibold">
                Retake Quiz
              </button>
              <Link href="/shop" className="btn-primary flex-1 py-2.5 rounded-lg text-sm font-semibold text-center">
                Browse All Products
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
