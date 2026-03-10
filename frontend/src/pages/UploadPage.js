import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeApi, interviewApi } from '../services/api';
import { Upload, FileText, CheckCircle, ChevronRight, Loader, Sparkles } from 'lucide-react';

const ROLES = [
  'Backend Developer', 'Frontend Developer', 'Full Stack Developer',
  'Data Science', 'Machine Learning Engineer', 'DevOps Engineer',
  'Software Engineer (General)'
];

export default function UploadPage() {
  const [step, setStep] = useState(1); // 1=upload, 2=select role, 3=generating
  const [file, setFile] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [questionCount, setQuestionCount] = useState(8);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const navigate = useNavigate();

  const handleFile = (f) => {
    if (!f.name.endsWith('.pdf')) { setError('Please upload a PDF file.'); return; }
    if (f.size > 10 * 1024 * 1024) { setError('File must be under 10 MB.'); return; }
    setFile(f); setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const { data } = await resumeApi.upload(file);
      const skills = await resumeApi.getSkills(data.resumeId);
      setResumeData({ ...data, skills: skills.data.skills });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!selectedRole) return;
    setStep(3); setLoading(true); setError('');
    try {
      const { data } = await interviewApi.startSession({
        resumeId: resumeData.resumeId,
        jobRole: selectedRole,
        questionCount
      });
      navigate(`/interview/${data.sessionId}`, { state: { session: data } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>New Interview</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Upload your resume and we'll create a personalised interview for you.</p>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 32 }} className="fade-up">
        {['Upload Resume', 'Select Role', 'Interview'].map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 6
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: step > i + 1 ? 'var(--green)' : step === i + 1 ? 'var(--blue)' : 'var(--surface-3)',
                border: `2px solid ${step === i + 1 ? 'var(--blue)' : step > i + 1 ? 'var(--green)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: step >= i + 1 ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.3s'
              }}>
                {step > i + 1 ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span style={{ fontSize: 12, color: step === i + 1 ? 'var(--text)' : 'var(--text-muted)', fontWeight: step === i + 1 ? 600 : 400 }}>{label}</span>
            </div>
            {i < 2 && <div style={{ width: 48, height: 2, background: step > i + 1 ? 'var(--green)' : 'var(--border)', marginBottom: 20, transition: 'all 0.3s' }} />}
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error fade-up">{error}</div>}

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="card fade-up">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileRef.current.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--blue)' : file ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: 12, padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
              background: dragOver ? 'rgba(37,99,235,0.05)' : file ? 'rgba(16,185,129,0.05)' : 'transparent',
              transition: 'all 0.2s'
            }}>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            {file ? (
              <>
                <FileText size={40} color="var(--green)" style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 700, fontSize: 16 }}>{file.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                  {(file.size / 1024).toFixed(0)} KB — Click to replace
                </div>
              </>
            ) : (
              <>
                <Upload size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 700, fontSize: 16 }}>Drop your resume here</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>PDF only · Max 10 MB</div>
              </>
            )}
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 20 }}
            onClick={handleUpload} disabled={!file || loading}>
            {loading ? <><Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Analysing resume...</> : <><span>Analyse Resume</span><ChevronRight size={16} /></>}
          </button>
        </div>
      )}

      {/* Step 2: Select role */}
      {step === 2 && (
        <div className="fade-up">
          {/* Detected skills */}
          {resumeData?.skills?.skills?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Sparkles size={16} color="var(--teal)" />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Skills Detected from Your Resume</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {resumeData.skills.skills.slice(0, 20).map((s, i) => (
                  <span key={i} style={{
                    background: 'var(--surface-3)', border: '1px solid var(--border)',
                    borderRadius: 20, padding: '4px 12px', fontSize: 13, color: 'var(--teal)'
                  }}>{typeof s === 'string' ? s : JSON.stringify(s)}</span>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 16 }}>Select Target Role</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {ROLES.map(role => (
                <button key={role} onClick={() => setSelectedRole(role)} style={{
                  padding: '12px 16px', borderRadius: 10, textAlign: 'left',
                  background: selectedRole === role ? 'rgba(37,99,235,0.15)' : 'var(--surface-3)',
                  border: `1.5px solid ${selectedRole === role ? 'var(--blue)' : 'var(--border)'}`,
                  color: selectedRole === role ? '#fff' : 'var(--text)',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s'
                }}>
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 16 }}>
              Number of Questions: <span style={{ color: 'var(--blue-light)' }}>{questionCount}</span>
            </div>
            <input type="range" min={5} max={15} value={questionCount}
              onChange={e => setQuestionCount(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--blue)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>5 (quick)</span><span>15 (thorough)</span>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%' }}
            onClick={handleStart} disabled={!selectedRole || loading}>
            {loading ? <><Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating questions...</> : <><span>Start Interview</span><ChevronRight size={16} /></>}
          </button>
        </div>
      )}

      {/* Step 3: Generating */}
      {step === 3 && (
        <div className="card fade-up" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div className="spinner" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Preparing your interview…</h2>
          <p style={{ color: 'var(--text-muted)' }}>Claude is generating personalised questions for your {selectedRole} interview.</p>
        </div>
      )}
    </div>
  );
}
