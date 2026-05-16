import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { applyForLoan } from '../../store/slices/loanSlice';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const loanTypes = ['PERSONAL', 'BUSINESS', 'HOME', 'AUTO', 'EDUCATION'];
const employmentStatuses = ['EMPLOYED', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'FREELANCER', 'STUDENT'];
const purposes = ['Home Renovation', 'Medical Emergency', 'Education', 'Business Expansion', 'Vehicle Purchase', 'Wedding', 'Travel', 'Debt Consolidation', 'Other'];

function calcEMI(p, r, n) {
  const rate = r / 12 / 100;
  if (!rate) return p / n;
  return (p * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
}
const defaultRates = { PERSONAL: 12, BUSINESS: 14, HOME: 8.5, AUTO: 10, EDUCATION: 9 };

export default function ApplyLoanPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector(s => s.loans);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ loanType: 'PERSONAL', loanAmount: '', tenure: '12', purpose: '', monthlyIncome: '', employmentStatus: 'EMPLOYED' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const rate = defaultRates[form.loanType];
  const emi = form.loanAmount && form.tenure ? calcEMI(+form.loanAmount, rate, +form.tenure) : 0;
  const totalPayable = emi * +form.tenure;
  const totalInterest = totalPayable - +form.loanAmount;

  const handleSubmit = async () => {
    if (!form.loanAmount || +form.loanAmount < 10000) { toast.error('Minimum loan amount is ₹10,000'); return; }
    if (!form.purpose) { toast.error('Please select a purpose'); return; }
    const res = await dispatch(applyForLoan({ ...form, loanAmount: +form.loanAmount, tenure: +form.tenure, monthlyIncome: +form.monthlyIncome }));
    if (applyForLoan.fulfilled.match(res)) {
      toast.success('Loan application submitted successfully!');
      navigate('/my-loans');
    } else {
      toast.error(res.payload || 'Failed to submit');
    }
  };

  return (
    <Layout title="Apply for Loan" subtitle="Complete your loan application in a few steps">
      {/* Steps indicator */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {['Loan Details', 'Employment Info', 'Review & Submit'].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '6px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step > i + 1 ? '#10B981' : step === i + 1 ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: step >= i + 1 ? '#fff' : '#475569', border: step === i + 1 ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
            </div>
            <div style={{ fontSize: '11px', color: step === i + 1 ? '#60A5FA' : '#475569', fontWeight: step === i + 1 ? 600 : 400 }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
        <div className="glass-card" style={{ padding: '32px' }}>
          {step === 1 && (
            <div>
              <h3 style={{ color: '#F1F5F9', fontWeight: 700, marginBottom: '24px', fontSize: '18px' }}>Loan Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>Loan Type</label>
                  <select className="input-dark" style={{ cursor: 'pointer' }} value={form.loanType} onChange={e => set('loanType', e.target.value)}>
                    {loanTypes.map(t => <option key={t} value={t} style={{ background: '#1E293B' }}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>Loan Amount (₹)</label>
                  <input className="input-dark" type="number" placeholder="500000" value={form.loanAmount} onChange={e => set('loanAmount', e.target.value)} />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>Tenure: <span style={{ color: '#60A5FA' }}>{form.tenure} months</span></label>
                <input type="range" min="6" max="360" step="6" value={form.tenure} onChange={e => set('tenure', e.target.value)}
                  style={{ width: '100%', accentColor: '#3B82F6', cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                  <span>6 months</span><span>360 months</span>
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>Purpose</label>
                <select className="input-dark" style={{ cursor: 'pointer' }} value={form.purpose} onChange={e => set('purpose', e.target.value)}>
                  <option value="" style={{ background: '#1E293B' }}>Select purpose</option>
                  {purposes.map(p => <option key={p} value={p} style={{ background: '#1E293B' }}>{p}</option>)}
                </select>
              </div>
              <button className="btn-primary" onClick={() => setStep(2)} style={{ width: '100%', justifyContent: 'center' }}>Continue →</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ color: '#F1F5F9', fontWeight: 700, marginBottom: '24px', fontSize: '18px' }}>Employment Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>Employment Status</label>
                  <select className="input-dark" style={{ cursor: 'pointer' }} value={form.employmentStatus} onChange={e => set('employmentStatus', e.target.value)}>
                    {employmentStatuses.map(s => <option key={s} value={s} style={{ background: '#1E293B' }}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>Monthly Income (₹)</label>
                  <input className="input-dark" type="number" placeholder="75000" value={form.monthlyIncome} onChange={e => set('monthlyIncome', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</button>
                <button className="btn-primary" onClick={() => setStep(3)} style={{ flex: 2, justifyContent: 'center' }}>Review Application →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={{ color: '#F1F5F9', fontWeight: 700, marginBottom: '24px', fontSize: '18px' }}>Review & Submit</h3>
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                {[
                  ['Loan Type', form.loanType],
                  ['Amount', `₹${parseFloat(form.loanAmount || 0).toLocaleString('en-IN')}`],
                  ['Tenure', `${form.tenure} months`],
                  ['Purpose', form.purpose],
                  ['Interest Rate', `${rate}% p.a.`],
                  ['Monthly EMI', `₹${Math.round(emi).toLocaleString('en-IN')}`],
                  ['Employment', form.employmentStatus],
                  ['Monthly Income', form.monthlyIncome ? `₹${parseFloat(form.monthlyIncome).toLocaleString('en-IN')}` : 'N/A'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#64748B' }}>{k}</span>
                    <span style={{ color: '#F1F5F9', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', padding: '14px', marginBottom: '24px', fontSize: '13px', color: '#94A3B8' }}>
                ℹ️ By submitting this application, you consent to a credit check and agree to our terms of service.
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>← Back</button>
                <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ flex: 2, justifyContent: 'center' }}>
                  {loading ? '⏳ Submitting...' : '🚀 Submit Application'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* EMI Preview */}
        <div className="glass-card" style={{ padding: '24px', position: 'sticky', top: '20px' }}>
          <h3 style={{ fontWeight: 700, color: '#F1F5F9', fontSize: '15px', marginBottom: '20px' }}>💰 Loan Preview</h3>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ color: '#64748B', fontSize: '12px', marginBottom: '4px' }}>Monthly EMI</p>
            <p style={{ fontSize: '32px', fontWeight: 800, background: 'linear-gradient(135deg,#60A5FA,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ₹{Math.round(emi).toLocaleString('en-IN')}
            </p>
          </div>
          {[
            ['Principal', `₹${parseFloat(form.loanAmount || 0).toLocaleString('en-IN')}`],
            ['Interest Rate', `${rate}% p.a.`],
            ['Total Interest', `₹${Math.round(totalInterest || 0).toLocaleString('en-IN')}`],
            ['Total Payable', `₹${Math.round(totalPayable || 0).toLocaleString('en-IN')}`],
            ['Duration', `${form.tenure} months`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#64748B' }}>{k}</span>
              <span style={{ color: '#CBD5E1', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
