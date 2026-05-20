import React, { useEffect, useState } from 'react';

const steps = [
  { id: 'PENDING', label: 'Application Submitted', description: 'We have received your application.' },
  { id: 'UNDER_REVIEW', label: 'Under Review', description: 'Our officers are reviewing your documents.' },
  { id: 'APPROVED', label: 'Approved', description: 'Your loan has been approved!' },
  { id: 'ACTIVE', label: 'Disbursed / Active', description: 'Funds have been transferred to your account.' },
  { id: 'REJECTED', label: 'Rejected', description: 'Unfortunately, your loan was rejected.' }
];

export default function ApplicationTrackerStepper({ loanId, initialStatus }) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);

  useEffect(() => {
    setCurrentStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (!loanId) return;

    // Use SSE for real-time updates
    const eventSource = new EventSource(`/api/v1/loans/${loanId}/status-stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status && data.status !== 'CONNECTED') {
          setCurrentStatus(data.status);
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE error", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [loanId]);

  const getStepIndex = (status) => {
    if (status === 'COMPLETED' || status === 'DEFAULTED') return 4;
    return steps.findIndex(s => s.id === status);
  };

  const currentIndex = getStepIndex(currentStatus);

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      <h3 style={{ color: '#F1F5F9', fontWeight: 700, fontSize: '16px', marginBottom: '20px' }}>
        📡 Live Application Status
      </h3>
      
      <div style={{ position: 'relative' }}>
        {steps.map((step, idx) => {
          // Skip Rejected if we are in a success flow
          if (step.id === 'REJECTED' && currentStatus !== 'REJECTED') return null;
          // Skip subsequent steps if Rejected
          if (currentStatus === 'REJECTED' && idx > getStepIndex('PENDING') && step.id !== 'REJECTED') return null;

          const isCompleted = currentIndex >= idx;
          const isCurrent = currentIndex === idx;
          const isRejected = step.id === 'REJECTED' && isCurrent;

          return (
            <div key={step.id} style={{ display: 'flex', marginBottom: idx === steps.length - 1 ? '0' : '20px', position: 'relative' }}>
              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div style={{
                  position: 'absolute', left: '15px', top: '30px', bottom: '-20px', width: '2px',
                  background: isCompleted ? (isRejected ? '#EF4444' : '#10B981') : 'rgba(255,255,255,0.1)',
                  zIndex: 0
                }} />
              )}
              
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
                background: isCompleted ? (isRejected ? '#EF4444' : '#10B981') : '#1E293B',
                border: `2px solid ${isCompleted ? (isRejected ? '#EF4444' : '#10B981') : '#475569'}`,
                color: isCompleted ? '#fff' : '#64748B', fontWeight: 'bold'
              }}>
                {isCompleted ? '✓' : idx + 1}
              </div>
              
              <div style={{ marginLeft: '16px', paddingTop: '4px' }}>
                <h4 style={{ margin: 0, color: isCurrent ? '#F1F5F9' : (isCompleted ? '#CBD5E1' : '#64748B'), fontSize: '14px', fontWeight: isCurrent ? 700 : 500 }}>
                  {step.label}
                </h4>
                <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '12px' }}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
