import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewApi } from '../services/api';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Trophy, ChevronDown, ChevronUp, Plus, BarChart2 } from 'lucide-react';

function ScoreBadge({ score }) {
  const n = parseFloat(score);
  const color = n >= 75 ? 'var(--green)' : n >= 50 ? 'var(--amber)' : 'var(--red)';
  return (
    <span style={{ color, fontWeight: 800, fontSize: 20 }}>
      {Math.round(n)}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>/100</span>
    </span>
  );
}

export default function ResultsPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    interviewApi.getResults(sessionId)
      .then(r => setResults(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!results) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Session not found.</div>;

  const overall = parseFloat(results.totalScore || 0);
  const scoreColor = overall >= 75 ? 'var(--green)' : overall >= 50 ? 'var(--amber)' : 'var(--red)';

  // Radar data by question type
  const typeScores = {};
  results.questions?.filter(q => q.answered).forEach(q => {
    if (!typeScores[q.type]) typeScores[q.type] = { total: 0, count: 0 };
    typeScores[q.type].total += parseFloat(q.score || 0);
    typeScores[q.type].count++;
  });
  const radarData = Object.entries(typeScores).map(([type, d]) => ({
    subject: type.charAt(0) + type.slice(1).toLowerCase(),
    score: Math.round(d.total / d.count)
  }));

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>Interview Results</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{results.jobRole} · {new Date(results.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Overall score hero */}
      <div className="card fade-up" style={{ textAlign: 'center', marginBottom: 20, padding: '40px 24px', background: `radial-gradient(ellipse at center, ${scoreColor}10 0%, var(--surface-2) 70%)` }}>
        <Trophy size={36} color={scoreColor} style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: 80, fontWeight: 900, color: scoreColor, letterSpacing: '-0.05em', lineHeight: 1 }}>
          {Math.round(overall)}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 16, marginTop: 8 }}>Overall Score / 100</div>
        <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text)' }}>
          {overall >= 75 ? '🎉 Excellent performance! You\'re interview-ready.' : overall >= 50 ? '👍 Good effort. A bit more practice will get you there.' : '💪 Keep studying. Review the suggested topics below.'}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }} className="fade-up">
        {[
          { label: 'Questions', value: results.questions?.length || 0 },
          { label: 'Answered', value: results.questions?.filter(q => q.answered).length || 0 },
          { label: 'Duration', value: results.completedAt ? `${Math.round((new Date(results.completedAt) - new Date(results.startedAt)) / 60000)} min` : '—' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Radar chart */}
      {radarData.length > 1 && (
        <div className="card fade-up" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart2 size={18} color="var(--teal)" />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Performance by Category</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Radar name="Score" dataKey="score" stroke="var(--blue)" fill="var(--blue)" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip contentStyle={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Question-by-question breakdown */}
      <div className="card fade-up" style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Question Breakdown</h2>
        {results.questions?.map((q, i) => (
          <div key={q.id} style={{ borderBottom: i < results.questions.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: i < results.questions.length - 1 ? 16 : 0, marginBottom: i < results.questions.length - 1 ? 16 : 0 }}>
            <div
              onClick={() => setExpanded(expanded === i ? null : i)}
              style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <span className={`badge badge-${q.type?.toLowerCase()}`}>{q.type}</span>
                  <span className={`badge badge-${q.difficulty?.toLowerCase()}`}>{q.difficulty}</span>
                </div>
                <p style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.5 }}>{q.questionText}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {q.answered ? <ScoreBadge score={q.score} /> : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Skipped</span>}
                {expanded === i ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
              </div>
            </div>

            {expanded === i && q.answered && (
              <div style={{ marginTop: 14, paddingLeft: 0 }} className="fade-up">
                {q.studentAnswer && (
                  <div style={{ background: 'var(--surface-3)', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Answer</div>
                    <p style={{ fontSize: 13, lineHeight: 1.7 }}>{q.studentAnswer}</p>
                  </div>
                )}
                {q.strengths && (
                  <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>✓ Strengths</div>
                    <p style={{ fontSize: 13, lineHeight: 1.7 }}>{q.strengths}</p>
                  </div>
                )}
                {q.improvements && (
                  <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', marginBottom: 4 }}>⚡ Improvements</div>
                    <p style={{ fontSize: 13, lineHeight: 1.7 }}>{q.improvements}</p>
                  </div>
                )}
                {q.suggestedTopics?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {q.suggestedTopics.map((t, j) => (
                      <span key={j} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }} className="fade-up">
        <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => navigate('/upload')}>
          <Plus size={16} /> New Interview
        </button>
        <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
