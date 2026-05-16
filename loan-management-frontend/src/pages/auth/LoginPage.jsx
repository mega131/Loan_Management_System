import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const res = await dispatch(login(form));
    if (login.fulfilled.match(res)) {
      toast.success(`Welcome back, ${res.payload.firstName}!`);
      const role = res.payload.role;
      if (['ADMIN', 'LOAN_OFFICER', 'MANAGER'].includes(role)) navigate('/admin');
      else navigate('/dashboard');
    } else {
      toast.error(res.payload || 'Login failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Background orbs */}
      <div style={{ position: 'absolute', top: '-200px', left: '-100px', width: '600px', height: '600px', background: 'rgba(59,130,246,0.06)', borderRadius: '50%', filter: 'blur(120px)' }} />
      <div style={{ position: 'absolute', bottom: '-200px', right: '-100px', width: '500px', height: '500px', background: 'rgba(139,92,246,0.06)', borderRadius: '50%', filter: 'blur(120px)' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px', margin: '0 20px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px', boxShadow: '0 20px 40px rgba(59,130,246,0.3)' }}>💎</div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em' }}>LoanVault</h1>
          <p style={{ color: '#475569', fontSize: '14px', marginTop: '6px' }}>Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '36px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>Email Address</label>
              <input className="input-dark" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>Password</label>
              <input className="input-dark" type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', color: '#F87171', fontSize: '13px' }}>
                ⚠️ {error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
              {loading ? '⏳ Signing in...' : '🔐 Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>Don't have an account?</p>
            <Link to="/register" className="btn-secondary" style={{ display: 'flex', justifyContent: 'center', width: '100%', textDecoration: 'none' }}>
              ✨ Create New Account
            </Link>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="glass-card" style={{ marginTop: '16px', padding: '16px 20px' }}>
          <p style={{ fontSize: '12px', color: '#475569', fontWeight: 600, marginBottom: '8px' }}>🔑 Demo Credentials</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ fontSize: '12px', color: '#64748B' }}><span style={{ color: '#60A5FA' }}>Admin:</span> admin@lms.com / Admin@12345</p>
            <p style={{ fontSize: '12px', color: '#64748B' }}><span style={{ color: '#A78BFA' }}>Officer:</span> officer@lms.com / Officer@12345</p>
          </div>
        </div>
      </div>
    </div>
  );
}
