import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { interviewApi } from '../services/api';
import { Send, ChevronRight, Loader, CheckCircle, AlertCircle } from 'lucide-react';

export default function InterviewPage() {
  const { sessionId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [session] = useState(state?.session);
  const [questions] = useState(state?.session?.questions || []);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [answered, setAnswered] = useState([]);

  if (!session) {
    navigate('/dashboard');
    return null;
  }

  const currentQ = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const hasAnsweredCurrent = answered.includes(currentIdx);

  const handleSubmit = async () => {
    if (!answer.trim() || loading) return;
    setLoading(true); setError('');
    try {
      const { data } = await interviewApi.submitAnswer(sessionId, currentQ.id, answer);
      setFeedback(data);
      setAnswered(prev => [...prev, currentIdx]);
      if (data.sessionResult) {
        setTimeout(() => navigate(`/results/${sessionId}`), 1800);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Evaluation failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setFeedback(null);
    setAnswer('');
    setCurrentIdx(i => i + 1);
  };

  const scoreColor = (s) => {
    const n = parseFloat(s);
    if (n >= 75) return 'var(--green)';
    if (n >= 50) return 'var(--amber)';
    return 'var(--red)';
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{session.jobRole} Interview</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            Detected skills: {session.detectedSkills?.slice(0, 4).join(', ')}{session.detectedSkills?.length > 4 ? ` +${session.detectedSkills.length - 4} more` : ''}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{currentIdx + 1}<span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>/{questions.length}</span></div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>questions</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 28, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: 'linear-gradient(90deg, var(--blue), var(--teal))',
          width: `${((currentIdx + (hasAnsweredCurrent ? 1 : 0)) / questions.length) * 100}%`,
          borderRadius: 2, transition: 'width 0.5s ease'
        }} />
      </div>

      {/* Question card */}
      <div className="card fade-up" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <span className={`badge badge-${currentQ.type?.toLowerCase()}`}>{currentQ.type}</span>
          <span className={`badge badge-${currentQ.difficulty?.toLowerCase()}`}>{currentQ.difficulty}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>Q{currentQ.order}</span>
        </div>
        <p style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.6 }}>{currentQ.questionText}</p>
      </div>

      {/* Answer box */}
      {!hasAnsweredCurrent ? (
        <div className="card fade-up-2">
          <label className="form-label">Your Answer</label>
          <textarea
            className="form-input"
            style={{ minHeight: 160, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
            placeholder="Type your answer here. Be as detailed as you can — explain your reasoning, mention examples, and use relevant technical terms."
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            disabled={loading}
          />
          {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}
          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 16 }}
            onClick={handleSubmit} disabled={!answer.trim() || loading}>
            {loading
              ? <><Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Evaluating…</>
              : <><span>Submit Answer</span><Send size={16} /></>}
          </button>
        </div>
      ) : feedback && (
        <div className="fade-up-2">
          {/* Score */}
          <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Score</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {feedback.answeredCount} of {feedback.totalCount} answered
              </div>
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: scoreColor(feedback.score), letterSpacing: '-0.04em' }}>
              {Math.round(parseFloat(feedback.score))}
            </div>
          </div>

          {/* Strengths */}
          <div className="card" style={{ marginBottom: 12, borderLeft: '3px solid var(--green)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CheckCircle size={16} color="var(--green)" />
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--green)' }}>Strengths</span>
            </div>
            <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>{feedback.strengths}</p>
          </div>

          {/* Improvements */}
          <div className="card" style={{ marginBottom: 12, borderLeft: '3px solid var(--amber)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AlertCircle size={16} color="var(--amber)" />
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--amber)' }}>Areas to Improve</span>
            </div>
            <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>{feedback.improvements}</p>
          </div>

          {/* Topics */}
          {feedback.suggestedTopics?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Study These Topics</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {feedback.suggestedTopics.map((t, i) => (
                  <span key={i} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 12px', fontSize: 13 }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {feedback.sessionResult ? (
            <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
              <CheckCircle size={32} color="var(--green)" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: 18 }}>Interview Complete!</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Redirecting to your results…</div>
            </div>
          ) : (
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleNext}>
              <span>Next Question</span><ChevronRight size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
