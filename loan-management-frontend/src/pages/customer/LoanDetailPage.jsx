import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEMISchedule, payEMI } from '../../store/slices/loanSlice';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import ApplicationTrackerStepper from '../../components/loans/ApplicationTrackerStepper';
import QRPaymentModal from '../../components/payments/QRPaymentModal';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getInterestRate = (loanType) => {
  const rates = { PERSONAL: 12, BUSINESS: 14, HOME: 8.5, AUTO: 10, EDUCATION: 9 };
  return rates[loanType] || 12;
};

const getTentativeEMIs = (loan) => {
  if (!loan) return [];
  const principal = parseFloat(loan.loanAmount);
  const annualRate = parseFloat(loan.interestRate || getInterestRate(loan.loanType));
  const tenure = parseInt(loan.tenure);

  const r = annualRate / 12 / 100;
  let emi = 0;
  if (r === 0) {
    emi = principal / tenure;
  } else {
    emi = (principal * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1);
  }
  emi = Math.round(emi * 100) / 100;

  let balance = principal;
  const emis = [];
  let startDate = loan.disbursalDate ? new Date(loan.disbursalDate) : new Date();

  for (let i = 1; i <= tenure; i++) {
    const interestAmount = Math.round(balance * r * 100) / 100;
    const principalAmount = Math.round((emi - interestAmount) * 100) / 100;
    balance = Math.round((balance - principalAmount) * 100) / 100;

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    emis.push({
      id: `tentative-${i}`,
      emiNumber: i,
      dueDate: dueDate.toISOString(),
      principalAmount,
      interestAmount,
      totalAmount: emi,
      status: 'TENTATIVE',
    });
  }
  return emis;
};

export default function LoanDetailPage() {
  const { loanId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { emiSchedule, myLoans, loading } = useSelector(s => s.loans);
  const [selectedEMI, setSelectedEMI] = useState(null);
  const loan = myLoans.find(l => l.id === loanId);

  useEffect(() => { dispatch(fetchEMISchedule(loanId)); }, [loanId, dispatch]);

  const officialEMIs = emiSchedule?.emis && emiSchedule.emis.length > 0;
  const isTentative = !officialEMIs && loan && (loan.status === 'PENDING' || loan.status === 'APPROVED');
  const emisToDisplay = officialEMIs ? emiSchedule.emis : (isTentative ? getTentativeEMIs(loan) : []);

  const handlePayEMI = async (emi) => {
    setSelectedEMI(null); // Close modal if open
    const res = await dispatch(payEMI({ loanId, emiNumber: emi.emiNumber, amount: emi.totalAmount, paymentMethod: 'UPI' }));
    if (payEMI.fulfilled.match(res)) {
      toast.success(`EMI #${emi.emiNumber} paid successfully via UPI!`);
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

    const totalPaidAmount = emiSchedule?.emis
      ?.filter(e => e.status === 'PAID')
      .reduce((sum, e) => sum + parseFloat(e.paidAmount || e.totalAmount || 0), 0) || 0;

    if (loan) {
      doc.setTextColor(241, 245, 249);
      doc.setFontSize(12);
      doc.text(`Loan Type: ${loan.loanType}`, 14, 45);
      doc.text(`Amount: Rs. ${parseFloat(loan.loanAmount).toLocaleString('en-IN')}`, 14, 55);
      doc.text(`Status: ${loan.status}`, 14, 65);
      doc.text(`Total Paid: Rs. ${totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, 75);
    }
    
    if (isTentative && loan) {
      doc.setFontSize(10);
      doc.setTextColor(245, 158, 11);
      doc.text('* Tentative Schedule (Official schedule generated upon disbursal)', 14, 83);
    }

    if (emisToDisplay.length > 0) {
      autoTable(doc, {
        startY: isTentative ? 88 : 82,
        head: [['EMI #', 'Due Date', 'Principal', 'Interest', 'Total', 'Status']],
        body: emisToDisplay.map(e => [
          e.emiNumber, 
          new Date(e.dueDate).toLocaleDateString('en-IN'), 
          `Rs. ${parseFloat(e.principalAmount).toFixed(2)}`, 
          `Rs. ${parseFloat(e.interestAmount).toFixed(2)}`, 
          `Rs. ${parseFloat(e.totalAmount).toFixed(2)}`, 
          e.status
        ]),
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

      <ApplicationTrackerStepper loanId={loan.id} initialStatus={loan.status} />

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
      {emiSchedule?.emis?.length > 0 && (
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
      {emisToDisplay.length > 0 ? (
        <div className="glass-card" style={{ padding: '24px' }}>
          {isTentative && (
            <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#FCD34D', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span> <span><strong>Projected Schedule:</strong> This is a tentative EMI schedule. The official schedule will be generated upon loan disbursal.</span>
            </div>
          )}
          <h3 style={{ color: '#F1F5F9', fontWeight: 700, marginBottom: '20px', fontSize: '16px' }}>📅 {isTentative ? 'Projected ' : ''}EMI Schedule</h3>
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
                {emisToDisplay.map(emi => (
                  <tr key={emi.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px', color: '#94A3B8', fontWeight: 600 }}>{emi.emiNumber}</td>
                    <td style={{ padding: '12px', color: '#CBD5E1' }}>{new Date(emi.dueDate).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '12px', color: '#CBD5E1' }}>₹{parseFloat(emi.principalAmount).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px', color: '#CBD5E1' }}>₹{parseFloat(emi.interestAmount).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px', color: '#F1F5F9', fontWeight: 600 }}>₹{parseFloat(emi.totalAmount).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px' }}><StatusBadge status={emi.status} /></td>
                    <td style={{ padding: '12px' }}>
                      {emi.status === 'PENDING' && loan.status === 'ACTIVE' && (
                        <button className="btn-success" onClick={() => setSelectedEMI(emi)} style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>📱</span> Pay with QR
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
          <h3 style={{ color: '#F1F5F9', fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>No EMI Schedule Yet</h3>
          <p style={{ fontSize: '14px' }}>Your official EMI schedule will be generated and displayed here once your loan is approved and disbursed by an administrator.</p>
        </div>
      )}

      {selectedEMI && (
        <QRPaymentModal 
          loanId={loan.id} 
          emi={selectedEMI} 
          onClose={() => setSelectedEMI(null)} 
          onPaymentComplete={handlePayEMI} 
        />
      )}
    </Layout>
  );
}
