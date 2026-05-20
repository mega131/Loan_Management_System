import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function QRPaymentModal({ loanId, emi, onClose, onPaymentComplete }) {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const res = await api.get(`/loans/${loanId}/emi/${emi.id}/pay-qr`);
        setQrCode(res.data.data.qrDataUrl);
      } catch (err) {
        console.error('Failed to fetch QR', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQR();
  }, [loanId, emi.id]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="glass-card" style={{ padding: '32px', width: '100%', maxWidth: '400px', textAlign: 'center', position: 'relative' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '20px' }}
        >
          ✕
        </button>
        
        <h2 style={{ color: '#F1F5F9', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Scan to Pay EMI</h2>
        <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>EMI #{emi.emiNumber}</p>
        
        {loading ? (
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : qrCode ? (
          <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', display: 'inline-block', marginBottom: '24px' }}>
            <img src={qrCode} alt="Payment QR Code" style={{ width: '200px', height: '200px' }} />
          </div>
        ) : (
          <p style={{ color: '#EF4444', marginBottom: '24px' }}>Failed to load QR Code</p>
        )}

        <div style={{ marginBottom: '24px' }}>
          <p style={{ color: '#64748B', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount to Pay</p>
          <p style={{ color: '#F1F5F9', fontSize: '32px', fontWeight: 800 }}>₹{parseFloat(emi.totalAmount).toLocaleString('en-IN')}</p>
        </div>

        <button 
          className="btn-primary" 
          style={{ width: '100%', padding: '14px' }} 
          onClick={() => onPaymentComplete(emi)}
        >
          Simulate Payment Success
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
