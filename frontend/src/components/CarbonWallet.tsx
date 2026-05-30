'use client';

import { getRankInfo } from '@/utils/rank';

interface CarbonWalletProps {
  totalCo2Saved: number;
  carbonCredits: number;
  routesCompleted: number;
}

export default function CarbonWallet({
  totalCo2Saved,
  carbonCredits,
  routesCompleted,
}: CarbonWalletProps) {
  const rankInfo = getRankInfo(carbonCredits);

  return (
    <div className="carbon-wallet">
      <div className="carbon-wallet-header">
        <span className="material-symbols-outlined carbon-wallet-icon text-primary">eco</span>
        <span className="carbon-wallet-title">Carbon Wallet</span>

        {/* Dynamic Rank Badge */}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: '10px',
            fontSize: '0.72rem',
            fontWeight: 700,
            background: rankInfo.styles.background,
            border: rankInfo.styles.border,
            color: rankInfo.styles.color,
            boxShadow: rankInfo.styles.shadow,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 0.3s ease',
          }}
        >
          <span className="material-symbols-outlined text-xs" style={{ fontSize: '0.9rem' }}>
            {rankInfo.icon}
          </span>
          <span>{rankInfo.title}</span>
        </div>
      </div>

      <div className="carbon-wallet-amount">
        {totalCo2Saved.toFixed(1)}
        <span className="carbon-wallet-unit">kg CO₂ saved</span>
      </div>

      <div className="carbon-wallet-credits">
        <span className="material-symbols-outlined carbon-wallet-credits-icon text-primary-fixed">star</span>
        <span>{carbonCredits} Green Credits earned</span>
      </div>

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.85rem',
          color: 'var(--color-verdex-text-muted)',
          position: 'relative',
        }}
      >
        <span className="material-symbols-outlined text-sm">pedal_bike</span>
        <span>{routesCompleted} eco-routes completed</span>
      </div>

      {/* Progress towards next reward tier */}
      <div style={{ marginTop: 20, position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            color: 'var(--color-verdex-text-muted)',
            marginBottom: 6,
          }}
        >
          <span>
            {rankInfo.level === 20 ? (
              <span>Max Rank Achieved 🎉</span>
            ) : (
              <span>Next Rank: <strong style={{ color: rankInfo.styles.color }}>{rankInfo.nextTitle}</strong></span>
            )}
          </span>
          <span>
            {rankInfo.level === 20
              ? `${Math.round(carbonCredits)} credits`
              : `${Math.round(rankInfo.currentPointsInLevel)} / ${rankInfo.neededPointsForNextLevel} pts`}
          </span>
        </div>
        <div className="session-gauge-bar">
          <div
            className="session-gauge-fill"
            style={{
              width: `${rankInfo.progressPercent}%`,
              background: rankInfo.level === 20
                ? 'linear-gradient(90deg, #a78bfa, #06b6d4)'
                : rankInfo.styles.color,
            }}
          />
        </div>
      </div>
    </div>
  );
}

