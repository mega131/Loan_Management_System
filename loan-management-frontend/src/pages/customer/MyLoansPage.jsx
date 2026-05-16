import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyLoans } from '../../store/slices/loanSlice';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

export default function MyLoansPage() {
  const dispatch = useDispatch();
  const { myLoans, loading } = useSelector(s => s.loans);

  useEffect(() => { dispatch(fetchMyLoans()); }, [dispatch]);

  return (
    <Layout title="My Loans" subtitle="Track all your loan applications and repayments">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <Link to="/apply" className="btn-primary">➕ New Application</Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : myLoans.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '80px 40px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📭</div>
          <h3 style={{ color: '#F1F5F9', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No Loans Yet</h3>
          <p style={{ color: '#64748B', marginBottom: '24px', fontSize: '14px' }}>You haven't applied for any loans. Get started today!</p>
          <Link to="/apply" className="btn-primary">Apply for a Loan</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '20px' }}>
          {myLoans.map(loan => (
            <div key={loan.id} className="glass-card glass-card-hover" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: loan.status === 'ACTIVE' || loan.status === 'APPROVED' ? 'linear-gradient(90deg,#10B981,#059669)' : loan.status === 'REJECTED' ? 'linear-gradient(90deg,#EF4444,#DC2626)' : 'linear-gradient(90deg,#3B82F6,#8B5CF6)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: '#475569', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>{loan.loanType}</p>
                  <p style={{ fontSize: '26px', fontWeight: 800, color: '#F1F5F9' }}>₹{parseFloat(loan.loanAmount).toLocaleString('en-IN')}</p>
                </div>
                <StatusBadge status={loan.status} />
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                {[
                  ['Purpose', loan.purpose || 'N/A'],
                  ['Tenure', `${loan.tenure} months`],
                  ['Interest Rate', `${loan.interestRate || 'TBD'}% p.a.`],
                  ['Applied On', new Date(loan.createdAt).toLocaleDateString('en-IN')],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: '#64748B' }}>{k}</span>
                    <span style={{ color: '#CBD5E1', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              {loan.rejectionReason && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', color: '#F87171' }}>❌ Reason: {loan.rejectionReason}</p>
                </div>
              )}
              <Link to={`/my-loans/${loan.id}`} style={{ display: 'block', textAlign: 'center', background: 'rgba(59,130,246,0.1)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}>
                View Details & EMI Schedule →
              </Link>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
