import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewApi } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Trophy, Target, Clock, Plus, ChevronRight, TrendingUp } from 'lucide-react';

function ScoreColor(score) {
  if (!score) return 'var(--text-muted)';
  const n = parseFloat(score);
  if (n >= 75) return 'var(--green)';
  if (n >= 50) return 'var(--amber)';
  return 'var(--red)';
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    interviewApi.getDashboard()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const completedSessions = data?.sessions?.filter(s => s.status === 'COMPLETED') || [];
  const chartData = completedSessions.slice().reverse().map((s, i) => ({
    session: `#${i + 1}`,
    score: parseFloat(s.totalScore) || 0,
    role: s.jobRole
  }));

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div className="fade-up">
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em' }}>
            Hey, {data?.fullName?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Track your interview progress and keep improving.</p>
        </div>
        <button className="btn btn-primary fade-up" onClick={() => navigate('/upload')}>
          <Plus size={16} /> New Interview
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { icon: <Trophy size={22} color="#f59e0b" />, label: 'Avg Score', value: data?.averageScore ? `${data.averageScore}` : '—', unit: '/100', color: '#f59e0b' },
          { icon: <Target size={22} color="#10b981" />, label: 'Completed', value: data?.completedSessions ?? 0, unit: ' sessions', color: '#10b981' },
          { icon: <Clock size={22} color="#3b82f6" />, label: 'Total Sessions', value: data?.totalSessions ?? 0, unit: ' total', color: '#3b82f6' },
        ].map((stat, i) => (
          <div key={i} className={`card fade-up-${i + 1}`} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: stat.color }}>
                {stat.value}<span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>{stat.unit}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="card fade-up" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <TrendingUp size={18} color="var(--blue-light)" />
            <h2 style={{ fontWeight: 700, fontSize: 16 }}>Score Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="session" stroke="var(--text-muted)" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--text)' }}
              />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sessions list */}
      <div className="card fade-up">
        <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Recent Sessions</h2>
        {data?.sessions?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: 16 }}>No sessions yet. Start your first mock interview!</p>
            <button className="btn btn-primary" onClick={() => navigate('/upload')}>
              <Plus size={16} /> Start Interview
            </button>
          </div>
        ) : (
          data.sessions.map(session => (
            <div key={session.id}
              onClick={() => session.status === 'COMPLETED' && navigate(`/results/${session.id}`)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: 10,
                background: 'var(--surface-3)', marginBottom: 8,
                cursor: session.status === 'COMPLETED' ? 'pointer' : 'default',
                border: '1px solid var(--border)', transition: 'border-color 0.15s'
              }}
              onMouseEnter={e => { if (session.status === 'COMPLETED') e.currentTarget.style.borderColor = 'var(--blue)'; }}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{session.jobRole}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {new Date(session.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {session.status === 'COMPLETED' ? (
                  <span style={{ fontWeight: 700, fontSize: 18, color: ScoreColor(session.totalScore) }}>
                    {parseFloat(session.totalScore).toFixed(0)}
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--amber)', background: 'rgba(245,158,11,0.1)', padding: '3px 8px', borderRadius: 6 }}>In Progress</span>
                )}
                {session.status === 'COMPLETED' && <ChevronRight size={16} color="var(--text-muted)" />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
