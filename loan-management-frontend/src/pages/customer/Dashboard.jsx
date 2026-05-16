import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyLoans } from '../../store/slices/loanSlice';
import Layout from '../../components/Layout';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B'];

export default function CustomerDashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { myLoans, loading } = useSelector(s => s.loans);

  useEffect(() => { dispatch(fetchMyLoans()); }, [dispatch]);

  const approved = myLoans.filter(l => l.status === 'APPROVED').length;
  const active = myLoans.filter(l => l.status === 'ACTIVE').length;
  const pending = myLoans.filter(l => l.status === 'PENDING').length;
  const totalAmount = myLoans.reduce((s, l) => s + parseFloat(l.loanAmount || 0), 0);

  const pieData = [
    { name: 'Pending', value: pending },
    { name: 'Active', value: active },
    { name: 'Approved', value: approved },
    { name: 'Completed', value: myLoans.filter(l => l.status === 'COMPLETED').length },
    { name: 'Rejected', value: myLoans.filter(l => l.status === 'REJECTED').length },
  ].filter(d => d.value > 0);

  return (
    <Layout>
      {/* Welcome header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#F1F5F9' }}>
            Welcome back, <span style={{ background: 'linear-gradient(135deg,#60A5FA,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.firstName}!</span> 👋
          </h1>
          <p style={{ color: '#64748B', marginTop: '6px', fontSize: '14px' }}>Here's your financial overview</p>
        </div>
        <Link to="/apply" className="btn-primary">➕ Apply for Loan</Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatsCard title="Total Loans" value={myLoans.length} icon="📋" color="#3B82F6" />
        <StatsCard title="Active Loans" value={active} icon="✅" color="#10B981" />
        <StatsCard title="Pending" value={pending} icon="⏳" color="#F59E0B" />
        <StatsCard title="Total Borrowed" value={`₹${totalAmount.toLocaleString('en-IN')}`} icon="💰" color="#8B5CF6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
        {/* Recent Loans */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '16px' }}>📋 Recent Loans</h3>
            <Link to="/my-loans" style={{ color: '#60A5FA', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : myLoans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <p>No loans yet. <Link to="/apply" style={{ color: '#60A5FA' }}>Apply now</Link></p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myLoans.slice(0, 5).map(loan => (
                <Link key={loan.id} to={`/my-loans/${loan.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
                    <div>
                      <p style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '16px' }}>₹{parseFloat(loan.loanAmount).toLocaleString('en-IN')}</p>
                      <p style={{ color: '#64748B', fontSize: '12px', marginTop: '2px' }}>{loan.loanType} • {loan.tenure} months</p>
                    </div>
                    <StatusBadge status={loan.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '16px', marginBottom: '20px' }}>📊 Loan Distribution</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F1F5F9', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                {pieData.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ color: '#94A3B8' }}>{item.name}</span>
                    <span style={{ color: '#F1F5F9', fontWeight: 600, marginLeft: 'auto' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#475569', padding: '40px 0' }}>No data yet</div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}
