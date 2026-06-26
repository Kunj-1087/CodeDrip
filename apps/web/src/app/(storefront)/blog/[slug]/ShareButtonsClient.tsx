'use client';

import { useState, useEffect } from 'react';

interface Props {
  title: string;
}

export default function ShareButtonsClient({ title }: Props) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareWhatsApp = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
  const shareTwitter = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted font-medium mr-1">Share:</span>
      
      {/* WhatsApp */}
      <a
        href={shareWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted hover:bg-surface-3 hover:text-[#25D366] transition-colors"
        title="Share on WhatsApp"
        aria-label="Share on WhatsApp"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436.002 9.858-4.417 9.86-9.858.002-2.636-1.023-5.115-2.885-6.978C16.58 1.905 14.1 .88 11.46.88c-5.44 0-9.863 4.42-9.865 9.861-.001 1.745.467 3.447 1.353 4.96l-.995 3.633 3.725-.976zm12.181-7.055c-.33-.165-1.951-.963-2.251-1.072-.3-.109-.518-.165-.736.165-.218.329-.844 1.072-1.036 1.29-.191.218-.383.245-.713.08-1.079-.54-1.885-.992-2.629-2.27-.197-.339-.197-.552-.03-.719.15-.15.33-.383.495-.575.165-.191.22-.329.33-.548.11-.219.055-.411-.027-.575-.083-.165-.736-1.774-.999-2.409-.255-.614-.52-.529-.713-.538-.184-.01-.395-.01-.606-.01s-.553.079-.844.4c-.29.32-.38.396-.38.964s-.413 1.112-.58 1.33c-.166.218-1.127 1.72-2.73 2.413-.38.165-.678.264-.91.338-.38.12-.727.103-1.002.062-.306-.046-.94-.384-1.072-.736-.133-.351-.133-.653-.093-.713.04-.06.147-.097.477-.262z" />
        </svg>
      </a>

      {/* Twitter / X */}
      <a
        href={shareTwitter}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted hover:bg-surface-3 hover:text-ink transition-colors"
        title="Share on X"
        aria-label="Share on X"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>

      {/* Copy Link */}
      <button
        onClick={handleCopy}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted hover:bg-surface-3 hover:text-primary transition-colors relative"
        title="Copy Link"
        aria-label="Copy Link"
      >
        {copied ? (
          <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2h2a2 2 0 002 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        )}
        {copied && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-ink px-2 py-1 text-[10px] text-surface whitespace-nowrap">
            Copied!
          </span>
        )}
      </button>
    </div>
  );
}
