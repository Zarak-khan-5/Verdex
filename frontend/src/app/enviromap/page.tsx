'use client';

import dynamic from 'next/dynamic';

const EnviroMapView = dynamic(() => import('@/components/EnviroMapView'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0c10',
        color: '#64748b',
        fontFamily: 'monospace',
        fontSize: 12,
        letterSpacing: '0.1em',
      }}
    >
      INITIALIZING MAP...
    </div>
  ),
});

export default function EnviroMapPage() {
  return (
    <>
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      <EnviroMapView />
    </>
  );
}
