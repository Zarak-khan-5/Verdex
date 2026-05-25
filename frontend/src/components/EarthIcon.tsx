'use client';

import React from 'react';

interface EarthIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  colored?: boolean;
}

export default function EarthIcon({ size = 20, className = '', style, colored = true }: EarthIconProps) {
  const combinedClassName = `${className} spinning-globe`.trim();

  if (colored) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={combinedClassName}
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          filter: 'drop-shadow(0 2px 5px rgba(59, 130, 246, 0.4))',
          ...style,
        }}
      >
        <defs>
          {/* 3D Radial Ocean Gradient (light center, dark edges for spherical curvature) */}
          <radialGradient id="earthOceanGrad" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#60a5fa" />    {/* Sunlight highlight */}
            <stop offset="30%" stopColor="#2563eb" />   {/* Deep royal blue */}
            <stop offset="75%" stopColor="#1d4ed8" />   {/* Dark ocean blue */}
            <stop offset="100%" stopColor="#0f172a" />  {/* Shadowed edge */}
          </radialGradient>

          {/* 3D Land/Continent Gradient */}
          <linearGradient id="earthLandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />    {/* Lush light green */}
            <stop offset="60%" stopColor="#059669" />   {/* Rich forest green */}
            <stop offset="100%" stopColor="#047857" />  {/* Shadowed land green */}
          </linearGradient>

          {/* Spherical Shadow Overlay (creates actual 3D volume) */}
          <radialGradient id="earthSphericalShadow" cx="30%" cy="30%" r="70%">
            <stop offset="60%" stopColor="#000000" stopOpacity="0" />
            <stop offset="85%" stopColor="#000000" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
          </radialGradient>

          {/* Subtle Atmosphere Ring Glow */}
          <linearGradient id="earthAtmoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* 1. Atmosphere Outer Ring Glow */}
        <circle
          cx="12"
          cy="12"
          r="10.8"
          stroke="url(#earthAtmoGrad)"
          strokeWidth="0.6"
          opacity="0.8"
        />

        {/* 2. Ocean Body (Base Sphere) */}
        <circle
          cx="12"
          cy="12"
          r="9.5"
          fill="url(#earthOceanGrad)"
          stroke="#2563eb"
          strokeWidth="0.5"
        />

        {/* 3. Coordinate Grid Overlay (Extremely subtle, behind lands) */}
        <path d="M2.5 12h19" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.4" />
        <path d="M12 2.5v19" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.4" />
        <path d="M12 2.5A9.5 9.5 0 0 1 12 21.5A9.5 9.5 0 0 1 12 2.5z" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="0.4" />

        {/* 4. Stylized Continents (filled with 3D land gradient) */}
        {/* North America / Greenland */}
        <path
          d="M5 8c.3-.5.7-.7.9-.5s.5 0 .7-.4c.1-.4.7.2.9.6.1.4-.1.6-.4.9s.4.6.7.4c.4-.2.6 0 .6.4s-.2.6-.6.6s-.6.2-.6.6c0 .4-.4.6-.7.4s-.6-.4-.6-.8c0-.4-.4-.6-.7-.4s-.6-.2-.6-.6c0-.4.2-.6.4-.9z"
          fill="url(#earthLandGrad)"
        />

        {/* Europe / Asia / Africa */}
        <path
          d="M13 5c.4-.3.7-.1.9.2c.1.4.6.4.9.2c.4-.2.7 0 .9.4s0 .7-.4.9c-.4.1-.1.6.1.8.3.1.6 0 .7-.4c.1-.4.6-.2.7.1c.1.4-.2.6-.4.9c-.1.3-.1.6.1.8c.3.1.4.6.1.9c-.2.3-.6.4-.6.6c0 .4-.4.6-.7.4s-.6.1-.6.6c0 .5-.4.6-.7.4s-.6-.4-.6-.8c0-.4-.4-.6-.7-.4s-.6.2-.6.6c0 .4-.1.6-.4.6s-.6-.2-.6-.6c0-.4-.4-.6-.7-.4c-.4.2-.6 0-.6-.4s-.3-.6-.6-.9c-.2-.3 0-.6.4-.8.4-.1.6-.6.4-.9s0-.6.4-.9c.4-.3.6-.7.4-1.1z"
          fill="url(#earthLandGrad)"
        />

        {/* South America */}
        <path
          d="M7.5 13.5c.2.4 0 .7-.4.9s-.6.6-.4.9c.2.3.2.7 0 .9c-.2.1-.4.6-.1.8c.2.1.2.6 0 .8s-.4.6-.6.6c-.2 0-.6-.4-.6-.8s.5-.8.8-1.2c.3-.4 0-.8-.5-1c-.5-.2-.8-.8-.5-1.2s.5-.8.8-1.2c.3-.4 0-.8-.5-1s.2-.8.5-1z"
          fill="url(#earthLandGrad)"
        />

        {/* Australia */}
        <path
          d="M17.5 16.5c.4.4.6 0 .9-.2c.3-.2.6 0 .6.4s-.4.6-.8.8c-.4.1-.6.4-.6.8c0 .4-.4.1-.7-.1s-.6-.6-.4-.9c.2-.3.6-.6 1-.6z"
          fill="url(#earthLandGrad)"
        />

        {/* 5. Swirling Cloud Patterns (Adds premium realism layer) */}
        {/* Curvy storm/winds cloud layers wrapping around */}
        <path
          d="M3.5 10c2.5-1.5 5.5-.5 7.5-1s4.5-1.5 7.5-.5c2 1 3.5 3 3 3.5"
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="0.8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M4.5 6.5c1.5-1 3.5.5 5-1s3.5-1.5 5.5-.5"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="0.6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M6 16c2.5 0 4.5 1.2 6.5.7s3.5-1.7 5.5-1.2"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="0.7"
          strokeLinecap="round"
          fill="none"
        />

        {/* 6. Spherical 3D Shadow Overlay (dark side of the Earth) */}
        <circle
          cx="12"
          cy="12"
          r="9.5"
          fill="url(#earthSphericalShadow)"
          pointerEvents="none"
        />
      </svg>
    );
  }

  // Monochromatic/Theme outline variant
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={combinedClassName}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        transition: 'all 0.3s ease',
        ...style,
      }}
    >
      <circle
        cx="12"
        cy="12"
        r="10.5"
        stroke="var(--color-verdex-primary, #059669)"
        strokeWidth="0.5"
        strokeDasharray="2 2"
        opacity="0.6"
      />
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
      />
      <path
        d="M2.5 12h19"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      <path
        d="M12 2.5a14 14 0 0 1 4.5 9.5 14 14 0 0 1-4.5 9.5A14 14 0 0 1 7.5 12 14 14 0 0 1 12 2.5z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M12 2.5v19"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      <path
        d="M6 7.5c.5-.8 1-.5 1.5-.2c.5.3 1-.3.8-.8c-.2-.5.5-.8 1-.5c.5.3.8-.5 1-.8c.2-.3.8 0 1 .5s0 1-.5 1.2c-.5.2-.2.8.2 1"
        stroke="var(--color-verdex-primary, #059669)"
        strokeWidth="1.25"
        opacity="0.85"
      />
    </svg>
  );
}
