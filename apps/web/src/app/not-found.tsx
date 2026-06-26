import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-px flex min-h-[70vh] flex-col items-center justify-center">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-surface-2 p-6 font-mono text-sm shadow-lg">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <span className="h-3 w-3 rounded-full bg-danger" />
          <span className="h-3 w-3 rounded-full bg-warning" />
          <span className="h-3 w-3 rounded-full bg-success" />
          <span className="ml-2 text-xs text-faint">terminal — bash</span>
        </div>

        <div className="mt-4 space-y-2">
          <p>
            <span className="text-success">user@codedrip</span>
            <span className="text-faint">:</span>
            <span className="text-primary">~</span>
            <span className="text-faint">$</span>{' '}
            <span className="text-ink">cd /page</span>
          </p>
          <p className="text-danger">
            bash: cd: /page: No such file or directory
          </p>
          <p>
            <span className="text-success">user@codedrip</span>
            <span className="text-faint">:</span>
            <span className="text-primary">~</span>
            <span className="text-faint">$</span>{' '}
            <span className="text-ink">echo &quot;Looks like you&apos;re lost.&quot;</span>
          </p>
          <p className="text-ink">Looks like you&apos;re lost.</p>
          <p>
            <span className="text-success">user@codedrip</span>
            <span className="text-faint">:</span>
            <span className="text-primary">~</span>
            <span className="text-faint">$</span>{' '}
            <span className="text-ink text-primary">_</span>
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-4">
          <Link href="/" className="rounded-xl border border-border bg-[#1A1A1E] px-5 h-11 flex items-center justify-center text-xs font-mono text-ink transition-colors hover:bg-white/[0.05] active:scale-[0.98]">
            cd ~
          </Link>
          <Link href="/shop" className="rounded-xl border border-primary/30 bg-primary/10 px-5 h-11 flex items-center justify-center text-xs font-mono text-primary transition-colors hover:bg-primary/20 active:scale-[0.98]">
            ls /shop
          </Link>
        </div>
      </div>
      <p className="mt-6 text-xs text-faint font-mono">Exit code: 404 — Page not found</p>
    </div>
  );
}
