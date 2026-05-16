import { useState } from 'react';
import { useSelector } from 'react-redux';
import Layout from '../../components/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useSelector(s => s.auth);
  const [form, setForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/auth/profile', form);
      toast.success('Profile updated successfully');
    } catch { toast.error('Failed to update profile'); }
    finally { setLoading(false); }
  };

  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' };

  return (
    <Layout title="Profile" subtitle="Manage your account information">
      <div style={{ maxWidth: '640px' }}>
        {/* Avatar */}
        <div className="glass-card" style={{ padding: '28px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, flexShrink: 0 }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <h2 style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '20px' }}>{user?.firstName} {user?.lastName}</h2>
            <p style={{ color: '#64748B', fontSize: '14px' }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <span style={{ padding: '3px 10px', borderRadius: '20px', background: 'rgba(59,130,246,0.12)', color: '#60A5FA', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(59,130,246,0.2)' }}>{user?.role}</span>
              <span style={{ padding: '3px 10px', borderRadius: '20px', background: user?.kycStatus === 'VERIFIED' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: user?.kycStatus === 'VERIFIED' ? '#34D399' : '#FCD34D', fontSize: '11px', fontWeight: 700, border: `1px solid ${user?.kycStatus === 'VERIFIED' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` }}>KYC: {user?.kycStatus}</span>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ color: '#F1F5F9', fontWeight: 700, marginBottom: '24px', fontSize: '16px' }}>Edit Profile</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input className="input-dark" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input className="input-dark" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email (cannot be changed)</label>
            <input className="input-dark" value={user?.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Phone</label>
            <input className="input-dark" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9876543210" />
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
        </div>

        {/* Account details */}
        <div className="glass-card" style={{ padding: '24px', marginTop: '20px' }}>
          <h3 style={{ color: '#F1F5F9', fontWeight: 700, marginBottom: '16px', fontSize: '15px' }}>Account Information</h3>
          {[
            ['Username', user?.username],
            ['Member Since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : 'N/A'],
            ['Last Login', user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN') : 'N/A'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
              <span style={{ color: '#64748B' }}>{k}</span>
              <span style={{ color: '#CBD5E1', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
