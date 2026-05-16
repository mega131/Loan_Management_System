import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllLoans, approveLoan, rejectLoan, disburseLoan } from '../../store/slices/loanSlice';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';

const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'REJECTED'];

export default function AdminLoansPage() {
  const dispatch = useDispatch();
  const { allLoans, loading } = useSelector(s => s.loans);
  const { user } = useSelector(s => s.auth);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [remarkInputs, setRemarkInputs] = useState({});
  const [rateInputs, setRateInputs] = useState({});

  useEffect(() => { dispatch(fetchAllLoans({ limit: 100 })); }, [dispatch]);

  const filtered = allLoans.filter(l => {
    const matchesFilter = filter === 'ALL' || l.status === filter;
    const matchesSearch = !search || [l.borrower?.firstName, l.borrower?.lastName, l.borrower?.email, l.loanType, l.purpose].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleApprove = async (loan) => {
    const res = await dispatch(approveLoan({ loanId: loan.id, notes: remarkInputs[loan.id] || '', interestRate: rateInputs[loan.id] || undefined }));
    if (approveLoan.fulfilled.match(res)) { toast.success('Loan approved!'); dispatch(fetchAllLoans({ limit: 100 })); }
    else toast.error(res.payload || 'Failed');
  };

  const handleReject = async (loan) => {
    if (!remarkInputs[loan.id]) { toast.error('Please provide a rejection reason'); return; }
    const res = await dispatch(rejectLoan({ loanId: loan.id, rejectionReason: remarkInputs[loan.id] }));
    if (rejectLoan.fulfilled.match(res)) { toast.success('Loan rejected'); dispatch(fetchAllLoans({ limit: 100 })); }
    else toast.error(res.payload || 'Failed');
  };

  const handleDisburse = async (loan) => {
    const res = await dispatch(disburseLoan({ loanId: loan.id }));
    if (disburseLoan.fulfilled.match(res)) { toast.success('Loan disbursed & EMI schedule generated!'); dispatch(fetchAllLoans({ limit: 100 })); }
    else toast.error(res.payload || 'Failed');
  };

  const canDisburse = ['MANAGER', 'ADMIN'].includes(user?.role);

  return (
    <Layout title="Loan Reviews" subtitle="Approve, reject, and manage all loan applications">
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
        <input className="input-dark" placeholder="🔍 Search by name, email, type..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: '300px' }} />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              background: filter === s ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'rgba(255,255,255,0.06)',
              color: filter === s ? '#fff' : '#94A3B8', border: 'none',
            }}>{s} {s !== 'ALL' && `(${allLoans.filter(l => l.status === s).length})`}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <p style={{ color: '#64748B' }}>No loans found for the selected filter</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(loan => (
            <div key={loan.id} className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: loan.status === 'PENDING' ? '#F59E0B' : loan.status === 'APPROVED' || loan.status === 'ACTIVE' ? '#10B981' : loan.status === 'REJECTED' ? '#EF4444' : '#8B5CF6', borderRadius: '4px 0 0 4px' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
                    {loan.borrower?.firstName?.[0]}{loan.borrower?.lastName?.[0]}
                  </div>
                  <div>
                    <p style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '15px' }}>{loan.borrower?.firstName} {loan.borrower?.lastName}</p>
                    <p style={{ color: '#64748B', fontSize: '12px' }}>{loan.borrower?.email}</p>
                  </div>
                </div>
                <StatusBadge status={loan.status} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px', marginBottom: '16px' }}>
                {[
                  ['Amount', `₹${parseFloat(loan.loanAmount).toLocaleString('en-IN')}`],
                  ['Type', loan.loanType],
                  ['Tenure', `${loan.tenure} months`],
                  ['Interest', `${loan.interestRate || 'TBD'}%`],
                  ['Purpose', loan.purpose || 'N/A'],
                  ['Applied', new Date(loan.createdAt).toLocaleDateString('en-IN')],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '10px 14px' }}>
                    <p style={{ color: '#475569', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{k}</p>
                    <p style={{ color: '#CBD5E1', fontSize: '13px', fontWeight: 600 }}>{v}</p>
                  </div>
                ))}
              </div>

              {loan.status === 'PENDING' && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '6px', fontWeight: 600 }}>Custom Interest Rate (optional)</label>
                      <input className="input-dark" type="number" step="0.1" placeholder={`Default: ${loan.interestRate || 12}%`}
                        value={rateInputs[loan.id] || ''} onChange={e => setRateInputs(p => ({ ...p, [loan.id]: e.target.value }))}
                        style={{ fontSize: '13px', padding: '8px 12px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#64748B', marginBottom: '6px', fontWeight: 600 }}>Notes / Rejection Reason *</label>
                      <input className="input-dark" placeholder="Add notes or rejection reason..."
                        value={remarkInputs[loan.id] || ''} onChange={e => setRemarkInputs(p => ({ ...p, [loan.id]: e.target.value }))}
                        style={{ fontSize: '13px', padding: '8px 12px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-success" onClick={() => handleApprove(loan)} style={{ flex: 1, padding: '10px' }}>✅ Approve</button>
                    <button className="btn-danger" onClick={() => handleReject(loan)} style={{ flex: 1, padding: '10px' }}>❌ Reject</button>
                  </div>
                </div>
              )}

              {loan.status === 'APPROVED' && canDisburse && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                  <button className="btn-primary" onClick={() => handleDisburse(loan)} style={{ width: '100%', justifyContent: 'center' }}>
                    🏦 Disburse Loan & Generate EMI Schedule
                  </button>
                </div>
              )}

              {loan.notes && (
                <div style={{ marginTop: '12px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '8px', padding: '10px 14px' }}>
                  <p style={{ fontSize: '12px', color: '#94A3B8' }}>📝 Notes: {loan.notes}</p>
                </div>
              )}
              {loan.rejectionReason && (
                <div style={{ marginTop: '12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', padding: '10px 14px' }}>
                  <p style={{ fontSize: '12px', color: '#F87171' }}>❌ Rejection Reason: {loan.rejectionReason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
