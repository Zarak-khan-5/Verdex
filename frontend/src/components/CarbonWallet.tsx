'use client';

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
  return (
    <div className="carbon-wallet">
      <div className="carbon-wallet-header">
        <span className="material-symbols-outlined carbon-wallet-icon text-primary">eco</span>
        <span className="carbon-wallet-title">Carbon Wallet</span>
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
          <span>Next Reward Tier</span>
          <span>{Math.min(carbonCredits, 500)} / 500</span>
        </div>
        <div className="session-gauge-bar">
          <div
            className="session-gauge-fill"
            style={{ width: `${Math.min((carbonCredits / 500) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
