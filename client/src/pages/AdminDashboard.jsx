import { useEffect, useMemo, useState } from 'react';
import { http } from '../api/http';
import { useAuth } from '../auth/AuthProvider';

const STATUSES = ['Pending', 'In Progress', 'Escalated', 'Resolved'];

function polarToCartesian(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [`M ${cx} ${cy}`, `L ${start.x} ${start.y}`, `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, 'Z'].join(' ');
}

function PieChartSVG({ items, size = 220 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = Math.min(cx, cy) - 4;
  const total = items.reduce((s, it) => s + it.value, 0) || 1;
  let acc = 0;
  return (
    <svg className="dataChart" viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: 'auto' }} preserveAspectRatio="xMidYMid meet">
      {items.map((it, i) => {
        const start = (acc / total) * 360;
        acc += it.value;
        const end = (acc / total) * 360;
        const d = describeArc(cx, cy, r, start, end);
        const mid = start + (end - start) / 2;
        const labelPos = polarToCartesian(cx, cy, r * 0.6, mid);
        return (
          <g key={i}>
            <path d={d} fill={it.color} stroke="#fff" />
            <text x={labelPos.x} y={labelPos.y} fontSize="12" textAnchor="middle" fill="#fff">{it.percent}%</text>
          </g>
        );
      })}
    </svg>
  );
}

function BarChartSVG({ items, width = 420, height = 240 }) {
  const padding = 24;
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;
  const max = Math.max(...items.map((i) => i.value), 1);
  const barW = plotW / items.length - 12;
  return (
    <svg className="dataChart" viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }} preserveAspectRatio="xMidYMid meet">
      {items.map((it, i) => {
        const x = padding + i * (barW + 12);
        const h = (it.value / max) * plotH;
        const y = padding + (plotH - h);
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} fill={it.color} rx="4" />
            <text x={x + barW / 2} y={y - 10} fontSize="12" textAnchor="middle" fill="#ffffff">
              {it.value} ({it.percent}%)
            </text>
            <text x={x + barW / 2} y={height - 6} fontSize="12" textAnchor="middle" fill="#ffffff">
              {it.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function AdminDashboard() {
  const { token } = useAuth() || {};
  const [complaints, setComplaints] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setError(null);
    http
      .get('/api/complaints', { token })
      .then((data) => {
        if (!mounted) return;
        setComplaints(data.complaints || []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Failed to load');
      });
    return () => {
      mounted = false;
    };
  }, [token]);

  const colors = ['#4f46e5', '#f59e0b', '#ef4444', '#10b981'];

  const stats = useMemo(() => {
    if (!complaints) return [];
    const counts = STATUSES.map((s) => ({ label: s, value: 0 }));
    complaints.forEach((c) => {
      const idx = STATUSES.indexOf(c.status) !== -1 ? STATUSES.indexOf(c.status) : 0;
      counts[idx].value += 1;
    });
    const total = counts.reduce((s, it) => s + it.value, 0) || 1;
    return counts.map((c, i) => ({ ...c, color: colors[i % colors.length], percent: Math.round((c.value / total) * 100) }));
  }, [complaints]);

  const summary = useMemo(() => {
    if (!complaints) return { total: 0, resolved: 0, remaining: 0 };
    const total = complaints.length;
    const resolved = complaints.filter((c) => c.status === 'Resolved').length;
    const remaining = total - resolved;
    const resolvedPct = total ? Math.round((resolved / total) * 100) : 0;
    const remainingPct = total ? Math.round((remaining / total) * 100) : 0;
    return { total, resolved, remaining, resolvedPct, remainingPct };
  }, [complaints]);

  return (
    <div className="stack">
      <div className="card">
        <h2>Admin : Dashboard</h2>
        <p className="muted">Complaint overview</p>

        {error && <div className="muted">Error: {error}</div>}
        {!complaints && !error && <div className="muted">Loading...</div>}
        {complaints && complaints.length === 0 && <div className="muted">No complaints yet</div>}
        {complaints && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ padding: 12, borderRadius: 8, background: '#f3f4f6', minWidth: 160 }}>
              <div style={{ fontSize: 14, color: '#374151' }}>Total complaints</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#000000' }}>{summary.total}</div>
            </div>

            <div style={{ padding: 12, borderRadius: 8, background: '#f3f4f6', minWidth: 160 }}>
              <div style={{ fontSize: 12, color: '#374151' }}>Remaining (unresolved)</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#000000' }}>{summary.remaining} <span style={{ fontSize: 18, color: '#6b7280' }}>({summary.remainingPct}%)</span></div>
            </div>
          </div>
        )}
        {stats && stats.length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {stats.map((s) => (
              <div key={s.label} style={{ padding: 10, borderRadius: 8, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', minWidth: 140 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, background: s.color, borderRadius: 2 }} />
                  <div style={{ fontSize: 13, color: '#374151' }}>{s.label}</div>
                </div>
                <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700, color: '#000000' }}>{s.value} <span style={{ fontSize: 18, color: '#6b7280' }}>({s.percent}%)</span>
              </div>
              </div>
            ))}
          </div>
        )}
        {complaints && complaints.length > 0 && (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', maxWidth: 1100 }}>
            <div className="pie-chart" style={{ flex: '1 1 45%', maxWidth: 400 }}>
              <h3 style={{ marginTop: 0 }}>By Status (Pie)</h3>
              <PieChartSVG items={stats} size={220} />
              <div style={{ marginTop: 8 }}>
                <strong>Pie Legend</strong>
                <div style={{ marginTop: 8 }}>
                  {stats.map((s) => (
                    <div key={s.label} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ width: 12, height: 12, background: s.color }} />
                      <div>{s.label}: {s.value} — {s.percent}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bar-chart" style={{ flex: '1 1 45%', minWidth: 520 }}>
              <h3 style={{ marginTop: 0 }}>By Status (Bar)</h3>
              <BarChartSVG items={stats} width={420} height={240} />
              <div style={{ marginTop: 8 }}>
                <strong>Bar Legend</strong>
                <div style={{ marginTop: 8 }}>
                  {stats.map((s) => (
                    <div key={s.label} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ width: 12, height: 12, background: s.color }} />
                      <div>{s.label}: {s.value} — {s.percent}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
