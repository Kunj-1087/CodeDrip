'use client';
// Last-resort boundary: catches errors thrown by the root layout itself (where
// the normal error.tsx can't render because the layout failed). It must supply
// its own <html>/<body>. Kept dependency-free and self-styled so it works even
// if the layout/providers never mounted.
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'JetBrains Mono, monospace',
          background: '#0A0A0A',
          color: '#F5F5F5',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>
          &gt; Error: Application crashed
        </h1>
        <p style={{ marginTop: '12px', color: '#A0A0A0', maxWidth: '28rem', fontSize: '14px' }}>
          The app hit an unexpected error. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: '24px',
            background: '#FF4D4D',
            color: '#0A0A0A',
            border: '1px solid #FF4D4D',
            borderRadius: '4px',
            padding: '10px 24px',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: 'JetBrains Mono, monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(255, 77, 77, 0.25)',
          }}
        >
          $ reboot --force
        </button>
      </body>
    </html>
  );
}
