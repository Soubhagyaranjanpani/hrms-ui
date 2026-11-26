import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
  FaChartBar, FaCheckCircle, FaFileAlt, FaStar, FaTrophy, FaInfoCircle, FaChartLine
} from 'react-icons/fa';
import {
  calculatePerformance,
  getDailyRatingData
} from './taskRating';
import './DailyWork.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

const TIMEFRAMES = [
  { id: 'ALL', label: 'All Period' },
  { id: '30D', label: 'Last 30 Days' },
  { id: '7D',  label: 'Last 7 Days' },
];

export default function DailyWorkPerformance({ submissions = [], monthValue, onMonthChange }) {
  const [timeframe, setTimeframe] = useState('ALL');

  const filteredSubmissions = useMemo(() => {
    if (!Array.isArray(submissions)) return [];
    if (timeframe === 'ALL') return submissions;

    const days = timeframe === '7D' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - days);

    return submissions.filter(sub => {
      const rawDate = sub.submissionDate || sub.date || sub.submittedAt || sub.createdAt;
      if (!rawDate) return true;
      const d = new Date(rawDate);
      return !isNaN(d) && d >= cutoff;
    });
  }, [submissions, timeframe]);

  const stats = useMemo(
    () => calculatePerformance(filteredSubmissions),
    [filteredSubmissions]
  );

  const dailyRatings = useMemo(
    () => getDailyRatingData(filteredSubmissions),
    [filteredSubmissions]
  );

  // Daily Reported Progress Line Chart (only dates with real submissions — never fabricates zeros)
  const dailyProgressSeries = useMemo(() => {
    const grouped = new Map();
    filteredSubmissions.forEach(sub => {
      const rawDate = sub.submissionDate || sub.date || sub.submittedAt;
      if (!rawDate) return;
      const key = String(rawDate).slice(0, 10);
      const prog = Number(sub.progressPercent);
      if (!Number.isFinite(prog)) return;

      if (!grouped.has(key)) grouped.set(key, { sum: 0, count: 0 });
      const entry = grouped.get(key);
      entry.sum += prog;
      entry.count += 1;
    });

    const sortedDates = [...grouped.keys()].sort();
    return {
      labels: sortedDates.map(d => `${d.slice(8, 10)}/${d.slice(5, 7)}`),
      values: sortedDates.map(d => {
        const { sum, count } = grouped.get(d);
        return count > 0 ? Math.round(sum / count) : null;
      }),
    };
  }, [filteredSubmissions]);

  const totalRated = (stats.low || 0) + (stats.medium || 0) + (stats.high || 0);
  const lowPct     = totalRated > 0 ? Math.round((stats.low / totalRated) * 100) : 0;
  const medPct     = totalRated > 0 ? Math.round((stats.medium / totalRated) * 100) : 0;
  const highPct    = totalRated > 0 ? Math.round((stats.high / totalRated) * 100) : 0;

  const getScoreColor = (avg) => {
    if (avg === null || avg === undefined) return 'var(--text-muted, #64748b)';
    if (avg >= 2.5) return '#16a34a';
    if (avg >= 1.5) return '#d97706';
    return '#ef4444';
  };

  const scorePctNum = stats.percentage != null ? Math.max(0, Math.min(100, Number(stats.percentage) || 0)) : 0;
  const ringRadius = 27;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - scorePctNum / 100);
  const ringStrokeColor = stats.average == null ? '#cbd5e1' : getScoreColor(stats.average);

  return (
    <div className="dw-card">
      {/* Unified Header + Optional Month Picker + Timeframe Filter */}
      <div className="dw-header">
        <div className="dw-title-wrap">
          <div className="dw-title-icon">
            <FaChartBar size={15} />
          </div>
          <div>
            <h3 className="dw-title">Daily Work Performance</h3>
            <p className="dw-subtitle">Reported progress trends &amp; approved quality ratings</p>
          </div>
        </div>

        <div className="dw-perf-controls">
          {typeof onMonthChange === 'function' && monthValue && (
            <input
              type="month"
              className="dw-month-input"
              value={monthValue}
              onChange={e => onMonthChange(e.target.value)}
              title="Select performance month"
            />
          )}

          <div className="dw-filter-group">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.id}
                type="button"
                className={`dw-filter-pill ${timeframe === tf.id ? 'active' : ''}`}
                onClick={() => setTimeframe(tf.id)}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Compact KPI Stat Cards */}
      <div className="dw-stats-grid">
        <div className="dw-stat" style={{ borderLeftColor: '#4f46e5' }}>
          <div className="dw-stat-top">
            <small>Total Reports</small>
            <div className="dw-stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>
              <FaFileAlt size={12} />
            </div>
          </div>
          <div className="dw-stat-bottom">
            <h2>{stats.total ?? 0}</h2>
            <span className="dw-stat-hint">Submitted logs</span>
          </div>
        </div>

        <div className="dw-stat" style={{ borderLeftColor: '#16a34a' }}>
          <div className="dw-stat-top">
            <small>Approved Reports</small>
            <div className="dw-stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
              <FaCheckCircle size={12} />
            </div>
          </div>
          <div className="dw-stat-bottom">
            <h2>{stats.approved ?? 0}</h2>
            <span className="dw-stat-hint">
              {stats.total > 0 ? `${Math.round((stats.approved / stats.total) * 100)}% rate` : 'No logs'}
            </span>
          </div>
        </div>

        <div className="dw-stat" style={{ borderLeftColor: '#d97706' }}>
          <div className="dw-stat-top">
            <small>Average Rating</small>
            <div className="dw-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <FaStar size={12} />
            </div>
          </div>
          <div className="dw-stat-bottom">
            <h2 style={{ color: getScoreColor(stats.average) }}>
              {stats.average === null || stats.average === undefined ? '—' : `${stats.average}/3`}
            </h2>
            <span className="dw-stat-hint">Scale 1.0–3.0</span>
          </div>
        </div>

        <div className="dw-stat" style={{ borderLeftColor: '#2563eb' }}>
          <div className="dw-stat-top">
            <small>Performance Score</small>
            <div className="dw-stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
              <FaTrophy size={12} />
            </div>
          </div>
          <div className="dw-stat-bottom">
            <h2 style={{ color: getScoreColor(stats.average) }}>
              {stats.percentage === null || stats.percentage === undefined ? '—' : `${stats.percentage}%`}
            </h2>
            <span className="dw-stat-hint">Quality index</span>
          </div>
        </div>
      </div>

      {/* Laptop-Fit 3-Column Bento Row: Quality Ring & Breakdown + 2 Charts */}
      <div className="dw-perf-bento">
        {/* Quality Score Ring & Rating Breakdown */}
        <div className="dw-quality-card">
          <div>
            <div className="dw-breakdown-head" style={{ marginBottom: 10 }}>
              <span className="dw-section-label">Rating Breakdown</span>
              <span className="dw-rated-count">{totalRated} rated</span>
            </div>

            <div className="dw-score-ring-wrap">
              <div className="dw-score-ring">
                <svg width="68" height="68" viewBox="0 0 68 68">
                  <circle
                    cx="34"
                    cy="34"
                    r={ringRadius}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="6"
                  />
                  <circle
                    cx="34"
                    cy="34"
                    r={ringRadius}
                    fill="none"
                    stroke={ringStrokeColor}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    transform="rotate(-90 34 34)"
                  />
                </svg>
                <div className="dw-score-ring-center">
                  <span>{stats.percentage == null ? '—' : `${Math.round(scorePctNum)}%`}</span>
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                  Quality Index
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
                  {stats.average == null
                    ? 'Awaiting rated approvals'
                    : `Avg ${stats.average} / 3.0 across ${totalRated} report${totalRated !== 1 ? 's' : ''}`}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="dw-dist-bar" style={{ marginBottom: 10 }}>
              {totalRated > 0 ? (
                <>
                  {highPct > 0 && <div style={{ width: `${highPct}%`, background: '#22c55e' }} />}
                  {medPct > 0  && <div style={{ width: `${medPct}%`,  background: '#f59e0b' }} />}
                  {lowPct > 0  && <div style={{ width: `${lowPct}%`,  background: '#ef4444' }} />}
                </>
              ) : (
                <div style={{ width: '100%', background: '#e2e8f0' }} />
              )}
            </div>

            <div className="dw-rating-rows">
              <div className="dw-rating-row dw-high">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span className="dw-dot" style={{ background: '#16a34a' }} /> High (3/3)
                </span>
                <span>{stats.high ?? 0}{totalRated > 0 ? ` (${highPct}%)` : ''}</span>
              </div>

              <div className="dw-rating-row dw-medium">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span className="dw-dot" style={{ background: '#d97706' }} /> Medium (2/3)
                </span>
                <span>{stats.medium ?? 0}{totalRated > 0 ? ` (${medPct}%)` : ''}</span>
              </div>

              <div className="dw-rating-row dw-low">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span className="dw-dot" style={{ background: '#dc2626' }} /> Low (1/3)
                </span>
                <span>{stats.low ?? 0}{totalRated > 0 ? ` (${lowPct}%)` : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Progress Line Chart */}
        <div className="dw-chart-section dw-chart-section--compact">
          <div className="dw-chart-header">
            <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700 }}>Daily Reported Progress (%)</h4>
          </div>
          {!dailyProgressSeries.labels.length ? (
            <div className="dw-empty-chart--compact">
              <FaChartLine size={18} color="#94a3b8" />
              <p className="dw-muted" style={{ margin: 0, fontSize: 12 }}>No progress submissions recorded.</p>
            </div>
          ) : (
            <div style={{ height: 180 }}>
              <Line
                data={{
                  labels: dailyProgressSeries.labels,
                  datasets: [
                    {
                      label: 'Avg Reported Progress %',
                      data: dailyProgressSeries.values,
                      borderColor: '#2563eb',
                      backgroundColor: 'rgba(37, 99, 235, 0.12)',
                      tension: 0.3,
                      fill: true,
                      spanGaps: true,
                      pointRadius: 4,
                      pointBackgroundColor: '#2563eb',
                      pointBorderColor: '#ffffff',
                      pointBorderWidth: 1.5,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: '#0f172a',
                      padding: 10,
                      cornerRadius: 8,
                      callbacks: {
                        label: ctx => `Progress: ${ctx.parsed.y}%`,
                      },
                    },
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { font: { size: 11 } },
                    },
                    y: {
                      beginAtZero: true,
                      max: 100,
                      grid: { color: '#f1f5f9' },
                      border: { display: false },
                      ticks: { callback: v => `${v}%`, font: { size: 11 } },
                    },
                  },
                }}
              />
            </div>
          )}
        </div>

        {/* Daily Rating Bar Chart */}
        <div className="dw-chart-section dw-chart-section--compact">
          <div className="dw-chart-header">
            <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700 }}>Daily Quality Rating (1–3)</h4>
          </div>
          {!dailyRatings.length ? (
            <div className="dw-empty-chart--compact">
              <FaStar size={18} color="#94a3b8" />
              <p className="dw-muted" style={{ margin: 0, fontSize: 12 }}>No approved rated reports available.</p>
            </div>
          ) : (
            <div style={{ height: 180 }}>
              <Bar
                data={{
                  labels: dailyRatings.map(d =>
                    d.date?.length >= 10 ? `${d.date.slice(8, 10)}/${d.date.slice(5, 7)}` : d.date
                  ),
                  datasets: [
                    {
                      label: 'Average Rating',
                      data: dailyRatings.map(d => d.average),
                      backgroundColor: dailyRatings.map(d =>
                        d.average >= 2.5 ? '#16a34a' : d.average >= 1.5 ? '#d97706' : '#dc2626'
                      ),
                      borderRadius: 6,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: '#0f172a',
                      padding: 10,
                      cornerRadius: 8,
                    },
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { font: { size: 11 } },
                    },
                    y: {
                      beginAtZero: true,
                      max: 3,
                      grid: { color: '#f1f5f9' },
                      border: { display: false },
                      ticks: { stepSize: 1, font: { size: 11 } },
                    },
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer Note */}
      <div className="dw-footer-note">
        <FaInfoCircle size={11} />
        <span>Average rating and performance score are computed from approved, rated submissions only.</span>
      </div>
    </div>
  );
}
