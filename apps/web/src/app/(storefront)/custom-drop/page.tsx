'use client';
import { useState, useRef, type FormEvent, type DragEvent, type ChangeEvent } from 'react';
import Link from 'next/link';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Not sure yet'] as const;
const COLORS = [
  { label: 'Black', hex: '#0A0A0A' },
  { label: 'White', hex: '#F4F4F5' },
  { label: 'Red', hex: '#CC0000' },
  { label: 'Grey', hex: '#71717A' },
] as const;
const PLACEMENTS = [
  'Front Center',
  'Back Center',
  'Left Chest',
  'Right Chest',
  'Sleeve',
  'Surprise me',
] as const;
const BUDGETS = [
  'Under ₹999',
  '₹999 – ₹1,499',
  '₹1,500 – ₹2,499',
  '₹2,500+',
  'Flexible',
] as const;
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_CHARS = 1000;
const TARGET_EMAIL = 'orders@codedrip.in';

interface FormData {
  name: string;
  email: string;
  size: string;
  color: string;
  description: string;
  placements: string[];
  budget: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  size?: string;
  color?: string;
  description?: string;
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function CustomDropPage() {
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    size: '',
    color: 'Black',
    description: '',
    placements: [],
    budget: '',
    notes: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const togglePlacement = (p: string) => {
    setForm((prev) => ({
      ...prev,
      placements: prev.placements.includes(p)
        ? prev.placements.filter((x) => x !== p)
        : [...prev.placements, p],
    }));
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const remaining = MAX_FILES - files.length;
    const valid: File[] = [];
    for (const f of arr.slice(0, remaining)) {
      const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
      if (!allowed.includes(f.type)) continue;
      if (f.size > MAX_FILE_SIZE) continue;
      valid.push(f);
    }
    if (valid.length === 0) return;
    const updated = [...files, ...valid];
    setFiles(updated);
    setFilePreviews((prev) => {
      const newPreviews = valid.map((f) => URL.createObjectURL(f));
      return [...prev, ...newPreviews];
    });
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = 'this field is required';
    if (!form.email.trim()) errs.email = 'this field is required';
    else if (!validateEmail(form.email.trim())) errs.email = 'invalid email address';
    if (!form.size) errs.size = 'select a size';
    if (!form.description.trim()) errs.description = 'describe your design';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildMailtoBody = (): string => {
    const lines = [
      '--- CUSTOM DROP REQUEST ---',
      '',
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Size: ${form.size}`,
      `Base Color: ${form.color}`,
      '',
      '--- DESIGN DESCRIPTION ---',
      form.description,
      '',
      `Placement: ${form.placements.join(', ') || 'Not specified'}`,
      `Budget: ${form.budget || 'Not specified'}`,
      '',
      `Additional Notes: ${form.notes || 'None'}`,
      '',
      `Reference Images: ${files.length} file(s) attached`,
      '',
      '--- END OF REQUEST ---',
    ];
    return lines.join('\n');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSending(true);
    const body = buildMailtoBody();
    const mailto = `mailto:${TARGET_EMAIL}?subject=${encodeURIComponent('Custom Drop Request — ' + form.name)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setSubmitted(true);
    setSending(false);
  };

  if (submitted) {
    return (
      <div className="container-px py-20 md:py-28">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 border border-primary/30">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Request submitted
          </h1>
          <p className="mt-3 text-muted font-mono text-sm">
            We&apos;ve opened your default email client with the request pre-filled. Send it to{' '}
            <span className="text-primary font-semibold">{TARGET_EMAIL}</span> and we&apos;ll review it within 48 hours.
          </p>
          <p className="mt-2 text-faint font-mono text-xs">
            Don&apos;t forget to attach your reference images before hitting send.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`mailto:${TARGET_EMAIL}`}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-mono rounded-xl"
            >
              Open email client
            </a>
            <Link
              href="/shop"
              className="btn-ghost inline-flex items-center gap-2 px-6 py-3 text-sm font-mono rounded-xl"
            >
              Browse shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-px py-12 md:py-16 lg:py-20">
      {/* ═══ HEADER ═══ */}
      <div className="mx-auto max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 font-mono text-xs text-primary shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span>v1.0.0 Custom Drops</span>
        </div>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink md:text-5xl lg:text-6xl leading-[1.05]">
          CUSTOM DROP<br />
          <span className="text-gradient">REQUEST</span>
        </h1>

        <p className="mt-4 text-base md:text-lg text-primary font-mono font-semibold tracking-tight">
          Tell us exactly what you want. We&apos;ll build it.
        </p>

        <p className="mt-3 max-w-2xl text-sm text-muted font-mono leading-relaxed">
          Describe your vision — graphic, text, placement, vibe. Upload references if you have them.
          Our team reviews every request and gets back within 48 hours.
        </p>

        {/* Red divider */}
        <div className="mt-8 mb-12 h-px w-full bg-gradient-to-r from-primary via-accent to-transparent" />
      </div>

      {/* ═══ FORM ═══ */}
      <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-3xl space-y-10">
        {/* FIELD 1 — Name */}
        <fieldset>
          <label htmlFor="cf-name" className="label">
            <span className="text-primary">//</span> YOUR NAME
          </label>
          <input
            id="cf-name"
            type="text"
            placeholder="enter your name"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={`input ${errors.name ? 'input-error' : ''}`}
          />
          {errors.name && (
            <p className="mt-1.5 font-mono text-xs text-danger flex items-center gap-1">
              <span>⚠</span> {errors.name}
            </p>
          )}
        </fieldset>

        {/* FIELD 2 — Email */}
        <fieldset>
          <label htmlFor="cf-email" className="label">
            <span className="text-primary">//</span> EMAIL ADDRESS
          </label>
          <input
            id="cf-email"
            type="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            className={`input ${errors.email ? 'input-error' : ''}`}
          />
          {errors.email && (
            <p className="mt-1.5 font-mono text-xs text-danger flex items-center gap-1">
              <span>⚠</span> {errors.email}
            </p>
          )}
        </fieldset>

        {/* FIELD 3 — Size */}
        <fieldset>
          <label htmlFor="cf-size" className="label">
            <span className="text-primary">//</span> PREFERRED SIZE
          </label>
          <div className="relative">
            <select
              id="cf-size"
              value={form.size}
              onChange={(e) => updateField('size', e.target.value)}
              className={`input appearance-none cursor-pointer ${errors.size ? 'input-error' : ''}`}
            >
              <option value="" disabled>Select size</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
          {errors.size && (
            <p className="mt-1.5 font-mono text-xs text-danger flex items-center gap-1">
              <span>⚠</span> {errors.size}
            </p>
          )}
        </fieldset>

        {/* FIELD 4 — Base Color */}
        <fieldset>
          <p className="label">
            <span className="text-primary">//</span> BASE COLOR
          </p>
          <div className="flex flex-wrap gap-4">
            {COLORS.map((c) => {
              const selected = form.color === c.label;
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => updateField('color', c.label)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all duration-150 cursor-pointer ${
                    selected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-surface-2'
                  }`}
                >
                  <span
                    className="h-8 w-8 rounded-full border border-border"
                    style={{ background: c.hex }}
                  />
                  <span className={`font-mono text-[10px] uppercase tracking-wider ${selected ? 'text-primary font-semibold' : 'text-faint'}`}>
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* FIELD 5 — Design Description */}
        <fieldset>
          <label htmlFor="cf-description" className="label">
            <span className="text-primary">//</span> DESCRIBE YOUR DESIGN
          </label>
          <div className="relative">
            <textarea
              id="cf-description"
              placeholder="Tell us everything — what graphic, what text, where it should go, what vibe you're going for. The more detail the better."
              value={form.description}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) updateField('description', e.target.value);
              }}
              className={`input min-h-[160px] resize-y ${errors.description ? 'input-error' : ''}`}
              rows={7}
            />
            <span className="absolute bottom-2 right-3 font-mono text-[10px] text-faint pointer-events-none">
              {form.description.length} / {MAX_CHARS}
            </span>
          </div>
          {errors.description && (
            <p className="mt-1.5 font-mono text-xs text-danger flex items-center gap-1">
              <span>⚠</span> {errors.description}
            </p>
          )}
        </fieldset>

        {/* FIELD 6 — Placement */}
        <fieldset>
          <p className="label">
            <span className="text-primary">//</span> PLACEMENT
          </p>
          <div className="flex flex-wrap gap-3">
            {PLACEMENTS.map((p) => {
              const checked = form.placements.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlacement(p)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border font-mono text-xs transition-all duration-150 cursor-pointer ${
                    checked
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface text-muted hover:border-primary/40 hover:text-ink'
                  }`}
                >
                  <span
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors ${
                      checked ? 'border-primary bg-primary' : 'border-border bg-surface-2'
                    }`}
                  >
                    {checked && (
                      <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  {p}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* FIELD 7 — Budget */}
        <fieldset>
          <label htmlFor="cf-budget" className="label">
            <span className="text-primary">//</span> ESTIMATED BUDGET{' '}
            <span className="text-faint font-normal tracking-normal normal-case">(optional)</span>
          </label>
          <div className="relative">
            <select
              id="cf-budget"
              value={form.budget}
              onChange={(e) => updateField('budget', e.target.value)}
              className="input appearance-none cursor-pointer"
            >
              <option value="" disabled>Select budget range</option>
              {BUDGETS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
        </fieldset>

        {/* FIELD 8 — Image Upload */}
        <fieldset>
          <p className="label">
            <span className="text-primary">//</span> UPLOAD REFERENCES
          </p>
          <p className="mb-3 font-mono text-[11px] text-faint leading-relaxed">
            Drop sketches, inspo images, logos, screenshots — anything that helps us understand your vision.
          </p>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all duration-150 ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-primary/40 bg-surface hover:border-primary hover:bg-primary/[0.03]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              multiple
              className="hidden"
              onChange={handleFileInput}
              disabled={files.length >= MAX_FILES}
            />
            <span className={dragOver ? 'text-primary' : 'text-muted'}>
              <UploadIcon />
            </span>
            <div className="text-center">
              <p className={`font-mono text-sm font-semibold ${dragOver ? 'text-primary' : 'text-ink'}`}>
                {dragOver ? 'DROP FILES HERE' : 'DRAG FILES HERE'}
              </p>
              <p className="mt-1 font-mono text-[11px] text-faint">
                or click to browse
              </p>
            </div>
            <p className="font-mono text-[10px] text-faint">
              PNG, JPG, WebP, GIF, SVG · Max 10MB each · Up to {MAX_FILES} files
            </p>
          </div>

          {files.length > 0 && (
            <div className="mt-3">
              <p className="font-mono text-xs text-primary mb-2">
                {files.length} / {MAX_FILES} uploaded
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filePreviews.map((src, idx) => (
                  <div key={src} className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-surface-2">
                    <img src={src} alt={`Reference ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-danger text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/80"
                      aria-label={`Remove file ${idx + 1}`}
                    >
                      <CloseIcon />
                    </button>
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white">
                      {files[idx].name.length > 12 ? files[idx].name.slice(0, 10) + '..' : files[idx].name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        {/* FIELD 9 — Additional Notes */}
        <fieldset>
          <label htmlFor="cf-notes" className="label">
            <span className="text-primary">//</span> ANYTHING ELSE?{' '}
            <span className="text-faint font-normal tracking-normal normal-case">(optional)</span>
          </label>
          <textarea
            id="cf-notes"
            placeholder="Deadlines, special requests, questions for the team..."
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            className="input resize-none"
            style={{ maxHeight: 100 }}
            rows={3}
          />
        </fieldset>

        {/* ═══ SUBMIT ═══ */}
        <div className="border-t border-border pt-8">
          <button
            type="submit"
            disabled={sending}
            className="btn-primary w-full flex items-center justify-center gap-3 px-8 py-4 text-sm font-mono rounded-xl text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <Spinner />
                <span>SENDING...</span>
              </>
            ) : (
              <span>SUBMIT CUSTOM REQUEST →</span>
            )}
          </button>
          <p className="mt-3 text-center font-mono text-[10px] text-faint">
            Your request will be reviewed by the CodeDrip team within 48 hours.
          </p>
        </div>
      </form>
    </div>
  );
}
