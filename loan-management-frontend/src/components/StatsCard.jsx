export default function StatsCard({ title, value, icon, color = '#3B82F6', subtitle }) {
  return (
    <div className="glass-card glass-card-hover" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: color, opacity: 0.08, borderRadius: '50%', filter: 'blur(20px)' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#64748B', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{title}</p>
          <p style={{ fontSize: '32px', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em' }}>{value}</p>
          {subtitle && <p style={{ color: '#475569', fontSize: '12px', marginTop: '4px' }}>{subtitle}</p>}
        </div>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: `1px solid ${color}30` }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
