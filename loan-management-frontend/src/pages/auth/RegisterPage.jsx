import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ username: '', email: '', password: '', firstName: '', lastName: '', phone: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    const res = await dispatch(register(form));
    if (register.fulfilled.match(res)) {
      toast.success('Account created! Please log in.');
      navigate('/login');
    } else {
      toast.error(res.payload || 'Registration failed');
    }
  };

  const inputStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' };

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '40px 20px' }}>
      <div style={{ position: 'absolute', top: '-200px', right: '-100px', width: '600px', height: '600px', background: 'rgba(139,92,246,0.06)', borderRadius: '50%', filter: 'blur(120px)' }} />
      <div style={{ position: 'absolute', bottom: '-200px', left: '-100px', width: '500px', height: '500px', background: 'rgba(59,130,246,0.06)', borderRadius: '50%', filter: 'blur(120px)' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px', boxShadow: '0 20px 40px rgba(59,130,246,0.3)' }}>💎</div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#F1F5F9' }}>Create Account</h1>
          <p style={{ color: '#475569', fontSize: '14px', marginTop: '6px' }}>Join LoanVault today</p>
        </div>

        <div className="glass-card" style={{ padding: '36px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={inputStyle}>First Name</label>
                <input className="input-dark" name="firstName" placeholder="John" value={form.firstName} onChange={handleChange} required />
              </div>
              <div>
                <label style={inputStyle}>Last Name</label>
                <input className="input-dark" name="lastName" placeholder="Doe" value={form.lastName} onChange={handleChange} required />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={inputStyle}>Username</label>
              <input className="input-dark" name="username" placeholder="johndoe123" value={form.username} onChange={handleChange} required />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={inputStyle}>Email</label>
              <input className="input-dark" type="email" name="email" placeholder="john@example.com" value={form.email} onChange={handleChange} required />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={inputStyle}>Phone</label>
              <input className="input-dark" name="phone" placeholder="+91 9876543210" value={form.phone} onChange={handleChange} />
            </div>
            <div style={{ marginBottom: '28px' }}>
              <label style={inputStyle}>Password (min 8 chars)</label>
              <input className="input-dark" type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', color: '#F87171', fontSize: '13px' }}>
                ⚠️ {error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
              {loading ? '⏳ Creating account...' : '✨ Create Account'}
            </button>
          </form>
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>Already have an account?</p>
            <Link to="/login" className="btn-secondary" style={{ display: 'flex', justifyContent: 'center', width: '100%', textDecoration: 'none' }}>
              🔐 Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
