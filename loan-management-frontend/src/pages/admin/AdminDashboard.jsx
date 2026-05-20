import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchPortfolio, fetchAllLoans } from '../../store/slices/loanSlice';
import Layout from '../../components/Layout';
import StatsCard from '../../components/StatsCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import RevenueChart from '../../components/charts/RevenueChart';

const COLORS = ['#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B'];

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { portfolio, allLoans, loading } = useSelector(s => s.loans);
  const { user } = useSelector(s => s.auth);

  useEffect(() => {
    dispatch(fetchPortfolio());
    dispatch(fetchAllLoans({ limit: 100 }));
  }, [dispatch]);

  const pieData = portfolio ? [
    { name: 'Active', value: portfolio.active || 0 },
    { name: 'Pending', value: portfolio.pending || 0 },
    { name: 'Completed', value: portfolio.completed || 0 },
    { name: 'Rejected', value: portfolio.rejected || 0 },
  ].filter(d => d.value > 0) : [];

  // Group loans by month for bar chart
  const monthlyData = allLoans.reduce((acc, loan) => {
    const month = new Date(loan.createdAt).toLocaleString('en-IN', { month: 'short' });
    const existing = acc.find(a => a.month === month);
    if (existing) existing.count++;
    else acc.push({ month, count: 1 });
    return acc;
  }, []).slice(-6);

  const recentPending = allLoans.filter(l => l.status === 'PENDING').slice(0, 5);

  const roleName = user?.role === 'ADMIN' ? 'System Admin' : user?.role === 'LOAN_OFFICER' ? 'Loan Officer' : 'Manager';

  return (
    <Layout title={`${roleName} Dashboard`} subtitle="System overview and analytics">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatsCard title="Total Loans" value={portfolio?.total || 0} icon="📋" color="#3B82F6" />
        <StatsCard title="Active Loans" value={portfolio?.active || 0} icon="✅" color="#10B981" />
        <StatsCard title="Pending Review" value={portfolio?.pending || 0} icon="⏳" color="#F59E0B" />
        <StatsCard title="Completed" value={portfolio?.completed || 0} icon="🏆" color="#8B5CF6" />
        <StatsCard title="Rejected" value={portfolio?.rejected || 0} icon="❌" color="#EF4444" />
        <StatsCard title="Approval Rate" value={`${portfolio?.approvalRate || 0}%`} icon="📈" color="#10B981" />
      </div>

      {/* Revenue and Loan Trends Charts */}
      <RevenueChart />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>

        {/* Pie chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '15px', marginBottom: '20px' }}>🎯 Loan Status Distribution</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F1F5F9', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                {pieData.map((item, i) => (
                  <span key={i} style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                    {item.name} ({item.value})
                  </span>
                ))}
              </div>
            </>
          ) : <div style={{ textAlign: 'center', color: '#475569', padding: '60px 0' }}>No data yet</div>}
        </div>
      </div>

      {/* Recent pending loans */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '15px' }}>⏳ Pending Reviews</h3>
          <Link to="/admin/loans" style={{ color: '#60A5FA', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
        </div>
        {recentPending.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#475569', padding: '40px', fontSize: '14px' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>✅</div>
            No pending applications — all caught up!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentPending.map(loan => (
              <div key={loan.id} style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '10px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '14px' }}>
                    {loan.borrower?.firstName} {loan.borrower?.lastName}
                    <span style={{ color: '#64748B', fontWeight: 400, fontSize: '13px', marginLeft: '8px' }}>— {loan.loanType}</span>
                  </p>
                  <p style={{ color: '#64748B', fontSize: '12px', marginTop: '2px' }}>₹{parseFloat(loan.loanAmount).toLocaleString('en-IN')} • {new Date(loan.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <Link to="/admin/loans" className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px', textDecoration: 'none' }}>Review</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
