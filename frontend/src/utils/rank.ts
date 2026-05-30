export interface RankInfo {
  level: number;
  title: string;
  nextTitle: string;
  nextPoints: number;
  currentPointsInLevel: number;
  neededPointsForNextLevel: number;
  progressPercent: number;
  icon: string;
  styles: {
    background: string;
    border: string;
    color: string;
    shadow: string;
  };
}

export const RANK_TITLES = [
  'Carbon Cadet',         // Level 0: < 50
  'Eco Walker',           // Level 1: 50 - 99
  'Green Commuter',       // Level 2: 100 - 149
  'Carbon Saver',         // Level 3: 150 - 199
  'Eco Enthusiast',       // Level 4: 200 - 249
  'Conservationist',      // Level 5: 250 - 299
  'Green Guardian',       // Level 6: 300 - 349
  'Eco Champion',         // Level 7: 350 - 399
  'Carbon Crusader',      // Level 8: 400 - 449
  'Planet Protector',     // Level 9: 450 - 499
  'Sustainability Star',  // Level 10: 500 - 549
  'Climate Warrior',      // Level 11: 550 - 599
  'Eco Ambassador',       // Level 12: 600 - 649
  'Green Pioneer',        // Level 13: 650 - 699
  'Carbon Conqueror',     // Level 14: 700 - 749
  'Eco Innovator',        // Level 15: 750 - 799
  'Planet Preserver',     // Level 16: 800 - 849
  'Green Legend',         // Level 17: 850 - 899
  'Carbon Master',        // Level 18: 900 - 949
  'Eco Visionary',        // Level 19: 950 - 999
  'Planet Savior',        // Level 20: 1000+
];

export function getRankInfo(credits: number): RankInfo {
  const points = Math.max(0, Math.round(credits || 0));

  let level = 0;
  if (points >= 1000) {
    level = 20;
  } else if (points >= 50) {
    level = Math.floor(points / 50);
  }

  const title = RANK_TITLES[level];
  const isMaxLevel = level === 20;
  const nextTitle = isMaxLevel ? 'Maximum Rank Reached' : RANK_TITLES[level + 1];
  
  let startPoints = 0;
  let nextPoints = 50;
  let currentPointsInLevel = points;
  let neededPointsForNextLevel = 50;

  if (isMaxLevel) {
    startPoints = 1000;
    nextPoints = 1000;
    currentPointsInLevel = points - 1000;
    neededPointsForNextLevel = 0;
  } else if (level >= 1) {
    startPoints = level * 50;
    nextPoints = (level + 1) * 50;
    currentPointsInLevel = points - startPoints;
    neededPointsForNextLevel = 50;
  }

  const progressPercent = isMaxLevel
    ? 100
    : Math.min(100, Math.max(0, (currentPointsInLevel / neededPointsForNextLevel) * 100));

  // Determine styles and icon based on rank tier
  let icon = 'pedal_bike';
  let styles = {
    background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.15), rgba(217, 119, 6, 0.03))',
    border: '1px solid rgba(217, 119, 6, 0.25)',
    color: '#f59e0b',
    shadow: '0 0 12px rgba(217, 119, 6, 0.15)',
  };

  if (level >= 20) {
    // Cosmic / Planet Savior
    icon = 'public';
    styles = {
      background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(6, 182, 212, 0.15))',
      border: '1px solid rgba(167, 139, 250, 0.45)',
      color: '#a78bfa',
      shadow: '0 0 16px rgba(167, 139, 250, 0.35)',
    };
  } else if (level >= 15) {
    // Platinum / Emerald
    icon = 'military_tech';
    styles = {
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(52, 211, 153, 0.05))',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      color: '#34d399',
      shadow: '0 0 12px rgba(16, 185, 129, 0.2)',
    };
  } else if (level >= 10) {
    // Gold
    icon = 'workspace_premium';
    styles = {
      background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(253, 224, 71, 0.05))',
      border: '1px solid rgba(234, 179, 8, 0.28)',
      color: '#facc15',
      shadow: '0 0 12px rgba(234, 179, 8, 0.2)',
    };
  } else if (level >= 5) {
    // Silver
    icon = 'forest';
    styles = {
      background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.15), rgba(203, 213, 225, 0.05))',
      border: '1px solid rgba(148, 163, 184, 0.28)',
      color: '#cbd5e1',
      shadow: '0 0 8px rgba(148, 163, 184, 0.12)',
    };
  }

  return {
    level,
    title,
    nextTitle,
    nextPoints,
    currentPointsInLevel,
    neededPointsForNextLevel,
    progressPercent,
    icon,
    styles,
  };
}
