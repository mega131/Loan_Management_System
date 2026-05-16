import { useState } from 'react';
import Layout from '../../components/Layout';

function calcEMI(p, r, n) {
  const rate = r / 12 / 100;
  if (!rate || !n) return 0;
  return (p * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
}

export default function EMICalculatorPage() {
  const [form, setForm] = useState({ principal: '', rate: '12', tenure: '12' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const p = +form.principal, r = +form.rate, n = +form.tenure;
  const emi = p && r && n ? calcEMI(p, r, n) : 0;
  const totalPayable = emi * n;
  const totalInterest = totalPayable - p;

  const presets = [
    { label: 'Personal 12%', rate: 12 }, { label: 'Home 8.5%', rate: 8.5 },
    { label: 'Auto 10%', rate: 10 }, { label: 'Education 9%', rate: 9 }, { label: 'Business 14%', rate: 14 },
  ];

  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' };

  return (
    <Layout title="EMI Calculator" subtitle="Calculate your monthly loan installment instantly">
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Preset rates */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '28px' }}>
          {presets.map(p => (
            <button key={p.label} onClick={() => set('rate', p.rate.toString())}
              style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: +form.rate === p.rate ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'rgba(255,255,255,0.06)', color: +form.rate === p.rate ? '#fff' : '#94A3B8', border: +form.rate === p.rate ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
          {/* Inputs */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <h3 style={{ color: '#F1F5F9', fontWeight: 700, marginBottom: '24px', fontSize: '18px' }}>Loan Parameters</h3>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Loan Amount (₹)</label>
              <input className="input-dark" type="number" placeholder="500000" value={form.principal} onChange={e => set('principal', e.target.value)} />
              <input type="range" min="10000" max="10000000" step="10000" value={form.principal || 0} onChange={e => set('principal', e.target.value)}
                style={{ width: '100%', accentColor: '#3B82F6', marginTop: '10px', cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                <span>₹10K</span><span>₹1 Cr</span>
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Annual Interest Rate: <span style={{ color: '#60A5FA' }}>{form.rate}%</span></label>
              <input className="input-dark" type="number" step="0.1" value={form.rate} onChange={e => set('rate', e.target.value)} />
              <input type="range" min="1" max="30" step="0.5" value={form.rate} onChange={e => set('rate', e.target.value)}
                style={{ width: '100%', accentColor: '#3B82F6', marginTop: '10px', cursor: 'pointer' }} />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={labelStyle}>Tenure: <span style={{ color: '#60A5FA' }}>{form.tenure} months ({(+form.tenure / 12).toFixed(1)} years)</span></label>
              <input className="input-dark" type="number" value={form.tenure} onChange={e => set('tenure', e.target.value)} />
              <input type="range" min="3" max="360" step="3" value={form.tenure} onChange={e => set('tenure', e.target.value)}
                style={{ width: '100%', accentColor: '#3B82F6', marginTop: '10px', cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                <span>3 months</span><span>30 years</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div>
            <div className="glass-card" style={{ padding: '32px', marginBottom: '20px', textAlign: 'center' }}>
              <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Monthly EMI</p>
              <p style={{ fontSize: '48px', fontWeight: 900, background: 'linear-gradient(135deg,#60A5FA,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
                ₹{Math.round(emi).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              {[
                ['Principal Amount', `₹${p.toLocaleString('en-IN')}`, '#60A5FA'],
                ['Total Interest', `₹${Math.round(totalInterest).toLocaleString('en-IN')}`, '#F87171'],
                ['Total Payable', `₹${Math.round(totalPayable).toLocaleString('en-IN')}`, '#34D399'],
              ].map(([k, v, c]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#94A3B8', fontSize: '14px' }}>{k}</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: c }}>{v}</span>
                </div>
              ))}
              {/* Visual breakdown */}
              {emi > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <p style={{ fontSize: '12px', color: '#475569', marginBottom: '8px', fontWeight: 600 }}>Principal vs Interest</p>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '100px', height: '10px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${(p / totalPayable) * 100}%`, background: '#3B82F6', transition: 'width 0.5s ease' }} />
                    <div style={{ flex: 1, background: '#EF4444' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '11px' }}>
                    <span style={{ color: '#60A5FA' }}>■ Principal {(p / totalPayable * 100).toFixed(1)}%</span>
                    <span style={{ color: '#F87171' }}>■ Interest {(totalInterest / totalPayable * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
