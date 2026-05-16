import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEMISchedule, payEMI } from '../../store/slices/loanSlice';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function LoanDetailPage() {
  const { loanId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { emiSchedule, myLoans, loading } = useSelector(s => s.loans);
  const loan = myLoans.find(l => l.id === loanId);

  useEffect(() => { dispatch(fetchEMISchedule(loanId)); }, [loanId, dispatch]);

  const handlePayEMI = async (emi) => {
    const res = await dispatch(payEMI({ loanId, emiNumber: emi.emiNumber, amount: emi.totalAmount, paymentMethod: 'ONLINE' }));
    if (payEMI.fulfilled.match(res)) {
      toast.success(`EMI #${emi.emiNumber} paid successfully!`);
      dispatch(fetchEMISchedule(loanId));
    } else toast.error(res.payload || 'Payment failed');
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(241, 245, 249);
    doc.setFontSize(20);
    doc.text('LoanVault - Loan Statement', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 30);
    if (loan) {
      doc.setTextColor(241, 245, 249);
      doc.setFontSize(12);
      doc.text(`Loan Type: ${loan.loanType}`, 14, 45);
      doc.text(`Amount: ₹${parseFloat(loan.loanAmount).toLocaleString('en-IN')}`, 14, 55);
      doc.text(`Status: ${loan.status}`, 14, 65);
    }
    if (emiSchedule?.emis) {
      autoTable(doc, {
        startY: 80,
        head: [['EMI #', 'Due Date', 'Principal', 'Interest', 'Total', 'Status']],
        body: emiSchedule.emis.map(e => [e.emiNumber, new Date(e.dueDate).toLocaleDateString('en-IN'), `₹${parseFloat(e.principalAmount).toFixed(2)}`, `₹${parseFloat(e.interestAmount).toFixed(2)}`, `₹${parseFloat(e.totalAmount).toFixed(2)}`, e.status]),
        styles: { fillColor: [30, 41, 59], textColor: [241, 245, 249], fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
        alternateRowStyles: { fillColor: [15, 23, 42] },
      });
    }
    doc.save(`loan-statement-${loanId}.pdf`);
    toast.success('Statement downloaded!');
  };

  if (!loan) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '80px' }}>
        <p style={{ color: '#64748B' }}>Loan not found. <button onClick={() => navigate('/my-loans')} style={{ color: '#60A5FA', background: 'none', border: 'none', cursor: 'pointer' }}>Go back</button></p>
      </div>
    </Layout>
  );

  const paid = emiSchedule?.emis?.filter(e => e.status === 'PAID').length || 0;
  const total = emiSchedule?.totalEMIs || loan.tenure;
  const progress = total > 0 ? (paid / total) * 100 : 0;

  return (
    <Layout title={`Loan Details`} subtitle={`${loan.loanType} Loan • ₹${parseFloat(loan.loanAmount).toLocaleString('en-IN')}`}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px', gap: '12px' }}>
        <button className="btn-secondary" onClick={downloadPDF}>📥 Download Statement</button>
        <button className="btn-secondary" onClick={() => navigate('/my-loans')}>← Back</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {[
          ['Loan Amount', `₹${parseFloat(loan.loanAmount).toLocaleString('en-IN')}`],
          ['Status', null],
          ['Interest Rate', `${loan.interestRate || 'TBD'}% p.a.`],
          ['Tenure', `${loan.tenure} months`],
          ['Monthly EMI', emiSchedule ? `₹${parseFloat(emiSchedule.monthlyEMI || 0).toLocaleString('en-IN')}` : '—'],
          ['Purpose', loan.purpose || 'N/A'],
        ].map(([k, v]) => (
          <div key={k} className="glass-card" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{k}</p>
            {v === null ? <StatusBadge status={loan.status} /> : <p style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9' }}>{v}</p>}
          </div>
        ))}
      </div>

      {/* Progress */}
      {emiSchedule && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: '#F1F5F9', fontWeight: 700 }}>Repayment Progress</h3>
            <span style={{ color: '#64748B', fontSize: '14px' }}>{paid} / {total} EMIs paid</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#3B82F6,#8B5CF6)', borderRadius: '100px', transition: 'width 0.8s ease' }} />
          </div>
          <p style={{ color: '#64748B', fontSize: '12px', marginTop: '8px' }}>{progress.toFixed(1)}% complete</p>
        </div>
      )}

      {/* EMI Schedule */}
      {emiSchedule?.emis && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ color: '#F1F5F9', fontWeight: 700, marginBottom: '20px', fontSize: '16px' }}>📅 EMI Schedule</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['#', 'Due Date', 'Principal', 'Interest', 'Total', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#475569', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {emiSchedule.emis.map(emi => (
                  <tr key={emi.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px', color: '#94A3B8', fontWeight: 600 }}>{emi.emiNumber}</td>
                    <td style={{ padding: '12px', color: '#CBD5E1' }}>{new Date(emi.dueDate).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '12px', color: '#CBD5E1' }}>₹{parseFloat(emi.principalAmount).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px', color: '#CBD5E1' }}>₹{parseFloat(emi.interestAmount).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px', color: '#F1F5F9', fontWeight: 600 }}>₹{parseFloat(emi.totalAmount).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px' }}><StatusBadge status={emi.status} /></td>
                    <td style={{ padding: '12px' }}>
                      {emi.status === 'PENDING' && loan.status === 'ACTIVE' && (
                        <button className="btn-success" onClick={() => handlePayEMI(emi)} style={{ fontSize: '12px', padding: '6px 12px' }}>Pay</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
