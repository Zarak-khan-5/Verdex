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
import { useEffect } from 'react';

export default function EnviroMapPage() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('verdex_theme');
    const root = window.document.documentElement;
    const body = window.document.body;
    if (savedTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      body.classList.remove('light');
    }
  }, []);

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
