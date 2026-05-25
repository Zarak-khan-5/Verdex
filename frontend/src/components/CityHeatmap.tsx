'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { MonthlyTrend } from '@/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CityHeatmapProps {
  monthlyTrend: MonthlyTrend[];
}

export default function CityHeatmap({ monthlyTrend }: CityHeatmapProps) {
  const data = {
    labels: monthlyTrend.map((t) => t.month),
    datasets: [
      {
        label: 'CO₂ Saved (kg)',
        data: monthlyTrend.map((t) => t.co2_saved),
        backgroundColor: monthlyTrend.map(
          (_, i) =>
            `rgba(16, 185, 129, ${0.4 + (i / monthlyTrend.length) * 0.6})`
        ),
        borderColor: 'rgba(16, 185, 129, 0.8)',
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(16, 185, 129, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 12 },
        },
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.06)',
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 12 },
        },
      },
    },
  };

  return (
    <div className="panel-card">
      <h3 className="panel-card-title">
        <span className="material-symbols-outlined panel-card-title-icon text-primary">bar_chart</span>
        Monthly CO₂ Savings Trend
      </h3>
      <div className="chart-container">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
