'use client';

import { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { CongestionReportResponse } from '@/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CongestionReportProps {
  city: string; // Lahore, Karachi, Islamabad, All
}

export default function CongestionReport({ city }: CongestionReportProps) {
  // Setup default week start (Monday of current week)
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const [weekStart, setWeekStart] = useState<string>(formatDate(getMonday(new Date())));
  const [selectedCorridor, setSelectedCorridor] = useState<string>('All');
  const [reportData, setReportData] = useState<CongestionReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBarToggle, setActiveBarToggle] = useState<'both' | 'am' | 'pm'>('both');

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const { getCongestionReport } = await import('@/services/api');
      const data = await getCongestionReport(city, weekStart, selectedCorridor);
      setReportData(data);
    } catch (err) {
      console.error('Failed to load congestion report:', err);
      setError('Could not retrieve congestion data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [city, weekStart, selectedCorridor]);

  // Adjust corridor choice if selected city changes (resets corridor to All)
  useEffect(() => {
    setSelectedCorridor('All');
  }, [city]);

  const stepWeek = (offsetWeeks: number) => {
    const current = new Date(weekStart);
    current.setDate(current.getDate() + offsetWeeks * 7);
    setWeekStart(formatDate(getMonday(current)));
  };

  const getWeekRangeString = (dateStr: string) => {
    const start = new Date(dateStr);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} – ${end.toLocaleDateString('en-US', options)}`;
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    const { summary, bar_chart, line_chart } = reportData;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Peak-Hour Eco Route Congestion Report\n';
    csvContent += `City,${city}\n`;
    csvContent += `Week Start,${weekStart}\n`;
    csvContent += `Corridor Filter,${selectedCorridor}\n\n`;

    csvContent += 'SUMMARY METRICS\n';
    csvContent += `Total Severe Flags,${summary.total_flags}\n`;
    csvContent += `Peak Day,${summary.peak_day}\n`;
    csvContent += `Worst Hour,${summary.worst_hour}\n`;
    csvContent += `AM Count (08:00-10:00),${summary.am_count}\n`;
    csvContent += `PM Count (17:00-20:00),${summary.pm_count}\n`;
    csvContent += `AM Split %,${summary.am_ratio}%\n`;
    csvContent += `PM Split %,${summary.pm_ratio}%\n\n`;

    csvContent += 'DAILY CONGESTION (AM vs PM)\n';
    csvContent += 'Day,AM Count (08:00-10:00),PM Count (17:00-20:00)\n';
    bar_chart.labels.forEach((label, i) => {
      csvContent += `"${label}",${bar_chart.am_data[i]},${bar_chart.pm_data[i]}\n`;
    });
    csvContent += '\n';

    csvContent += 'HOURLY CONGESTION INTENSITY\n';
    csvContent += 'Hour,Count\n';
    line_chart.labels.forEach((label, i) => {
      csvContent += `"${label}",${line_chart.data[i]}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `congestion_report_${city.toLowerCase()}_${weekStart}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Grouped Bar Chart config
  const barChartData = {
    labels: reportData?.bar_chart.labels || [],
    datasets: [
      ...(activeBarToggle === 'both' || activeBarToggle === 'am'
        ? [
            {
              label: 'AM Congestion (08:00-10:00)',
              data: reportData?.bar_chart.am_data || [],
              backgroundColor: 'rgba(56, 189, 248, 0.75)',
              borderColor: 'rgba(56, 189, 248, 1)',
              borderWidth: 1.5,
              borderRadius: 6,
            },
          ]
        : []),
      ...(activeBarToggle === 'both' || activeBarToggle === 'pm'
        ? [
            {
              label: 'PM Congestion (17:00-20:00)',
              data: reportData?.bar_chart.pm_data || [],
              backgroundColor: 'rgba(251, 146, 60, 0.75)',
              borderColor: 'rgba(251, 146, 60, 1)',
              borderWidth: 1.5,
              borderRadius: 6,
            },
          ]
        : []),
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(16, 185, 129, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
    },
  };

  // Line Chart config
  const lineValues = reportData?.line_chart.data || [];
  const maxLineVal = lineValues.length > 0 ? Math.max(...lineValues) : 0;

  const pointBackgrounds = lineValues.map((v) =>
    v === maxLineVal && maxLineVal > 0 ? '#ef4444' : '#10b981'
  );
  const pointBorders = lineValues.map((v) =>
    v === maxLineVal && maxLineVal > 0 ? '#fca5a5' : '#6ee7b7'
  );
  const pointRadii = lineValues.map((v) =>
    v === maxLineVal && maxLineVal > 0 ? 8 : 4.5
  );
  const pointHoverRadii = lineValues.map((v) =>
    v === maxLineVal && maxLineVal > 0 ? 10 : 7
  );

  const lineChartData = {
    labels: reportData?.line_chart.labels || [],
    datasets: [
      {
        label: 'Severe Flags count',
        data: lineValues,
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderColor: '#10b981',
        borderWidth: 2,
        tension: 0.3,
        pointBackgroundColor: pointBackgrounds,
        pointBorderColor: pointBorders,
        pointBorderWidth: 1.5,
        pointRadius: pointRadii,
        pointHoverRadius: pointHoverRadii,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(16, 185, 129, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          afterBody: (context: any) => {
            const index = context[0].dataIndex;
            const val = lineValues[index];
            if (val === maxLineVal && maxLineVal > 0) {
              return '🔥 PEAK INTENSITY HOUR';
            }
            return '';
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      {/* Filters and Navigation Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        {/* Date Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => stepWeek(-1)}
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}
            title="Previous Week"
          >
            <span className="material-symbols-outlined text-xs">arrow_back</span>
          </button>
          
          <div style={{ textAlign: 'center', minWidth: '220px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#f8fafc' }}>
              {getWeekRangeString(weekStart)}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#10b981', fontFamily: 'monospace', letterSpacing: 1.5 }}>
              WEEK START: {weekStart}
            </div>
          </div>

          <button
            onClick={() => stepWeek(1)}
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}
            title="Next Week"
          >
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </button>
        </div>

        {/* Corridor Selector and Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-verdex-text-muted)' }}>Corridor:</span>
            <select
              value={selectedCorridor}
              onChange={(e) => setSelectedCorridor(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: '0.8rem',
                borderRadius: '8px',
                border: '1px solid rgba(11, 94, 67, 0.3)',
                background: 'rgba(3, 6, 5, 0.6)',
                color: 'var(--color-verdex-text)',
                outline: 'none',
              }}
            >
              <option value="All">All Corridors</option>
              {reportData?.corridors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={loading || !reportData || reportData.summary.total_flags === 0}
            className="btn-primary flex items-center gap-1"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              opacity: loading || !reportData || reportData.summary.total_flags === 0 ? 0.5 : 1,
            }}
            title="Export Report data to CSV"
          >
            <span className="material-symbols-outlined text-xs">download</span>
            CSV Export
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
          <span className="material-symbols-outlined text-primary text-3xl animate-spin">refresh</span>
          <p className="panel-card-description">Compiling weekly congestion reports...</p>
        </div>
      ) : error ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
          <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
          <p className="panel-card-description text-red-400">{error}</p>
        </div>
      ) : !reportData ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
          <span className="material-symbols-outlined text-slate-500 text-3xl">sentiment_dissatisfied</span>
          <p className="panel-card-description">No data available for this week.</p>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="panel-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-verdex-text-muted)' }}>
                  WEEKLY SEVERE FLAGS
                </span>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.2rem' }}>warning</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f8fafc' }}>
                {reportData.summary.total_flags}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>
                Active safety hazards detected
              </div>
            </div>

            <div className="panel-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-verdex-text-muted)' }}>
                  PEAK DAY
                </span>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.2rem' }}>calendar_month</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fb923c' }}>
                {reportData.summary.peak_day}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>
                Highest frequency of alerts
              </div>
            </div>

            <div className="panel-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-verdex-text-muted)' }}>
                  WORST HOUR
                </span>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.2rem' }}>schedule</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                {reportData.summary.worst_hour}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>
                Peak traffic congestion window
              </div>
            </div>

            <div className="panel-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-verdex-text-muted)' }}>
                  AM / PM SPLIT RATIO
                </span>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.2rem' }}>contrast</span>
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, color: '#f8fafc', marginTop: 4 }}>
                <span style={{ color: '#38bdf8' }}>{reportData.summary.am_ratio}%</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-verdex-text-muted)' }}>:</span>
                <span style={{ color: '#fb923c' }}>{reportData.summary.pm_ratio}%</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>{reportData.summary.am_count} AM flags</span>
                <span>{reportData.summary.pm_count} PM flags</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
            {/* Grouped Bar Chart */}
            <div className="panel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 className="panel-card-title" style={{ marginBottom: 2 }}>
                    <span className="material-symbols-outlined panel-card-title-icon text-primary">bar_chart</span>
                    Daily Congestion (AM vs PM)
                  </h3>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '4px', color: '#1aa876', textTransform: 'uppercase' }}>
                    {city} — Rush hour comparison
                  </div>
                </div>

                {/* Bar toggles */}
                <div style={{ display: 'flex', background: 'rgba(3, 6, 5, 0.4)', borderRadius: 6, border: '1px solid rgba(11, 94, 67, 0.2)', padding: 2 }}>
                  <button
                    onClick={() => setActiveBarToggle('both')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      borderRadius: 4,
                      background: activeBarToggle === 'both' ? 'var(--color-verdex-primary)' : 'transparent',
                      color: activeBarToggle === 'both' ? '#022c22' : 'var(--color-verdex-text-muted)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    Both
                  </button>
                  <button
                    onClick={() => setActiveBarToggle('am')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      borderRadius: 4,
                      background: activeBarToggle === 'am' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                      color: activeBarToggle === 'am' ? '#38bdf8' : 'var(--color-verdex-text-muted)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    AM Only
                  </button>
                  <button
                    onClick={() => setActiveBarToggle('pm')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      borderRadius: 4,
                      background: activeBarToggle === 'pm' ? 'rgba(251, 146, 60, 0.2)' : 'transparent',
                      color: activeBarToggle === 'pm' ? '#fb923c' : 'var(--color-verdex-text-muted)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    PM Only
                  </button>
                </div>
              </div>

              <div className="chart-container" style={{ height: 260 }}>
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>

            {/* Hourly Line Chart */}
            <div className="panel-card">
              <h3 className="panel-card-title" style={{ marginBottom: 2 }}>
                <span className="material-symbols-outlined panel-card-title-icon text-primary">show_chart</span>
                Hourly Congestion Intensity
              </h3>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '4px', color: '#1aa876', textTransform: 'uppercase', marginBottom: 16 }}>
                {city} — Daytime & Evening (08:00 - 20:00)
              </div>

              <div className="chart-container" style={{ height: 260 }}>
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
