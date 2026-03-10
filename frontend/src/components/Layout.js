import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Upload, LogOut, Brain } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: 'var(--surface-2)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 0', flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{ padding: '0 24px 32px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Brain size={20} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>PrepAI</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0 12px' }}>
          {[
            { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
            { to: '/upload', icon: <Upload size={18} />, label: 'New Interview' },
          ].map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10,
              color: isActive ? '#fff' : 'var(--text-muted)',
              background: isActive ? 'var(--blue)' : 'transparent',
              textDecoration: 'none', fontSize: 14, fontWeight: 500,
              marginBottom: 4, transition: 'all 0.15s'
            })}>
              {icon}{label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '0 12px' }}>
          <div style={{
            padding: '12px 14px', borderRadius: 10,
            background: 'var(--surface-3)', marginBottom: 8
          }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.fullName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '10px 14px', borderRadius: 10,
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', fontSize: 14, fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.15s'
          }}
            onMouseEnter={e => { e.target.style.background = 'var(--surface-3)'; e.target.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-muted)'; }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '40px' }}>
        <Outlet />
      </main>
    </div>
  );
}
