import Sidebar from './Sidebar';

export default function Layout({ children, title, subtitle }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0F172A' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {/* Background glows */}
        <div style={{ position: 'fixed', top: '-100px', right: '-100px', width: '500px', height: '500px', background: 'rgba(59,130,246,0.05)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: '-100px', left: '20%', width: '400px', height: '400px', background: 'rgba(139,92,246,0.04)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ padding: '32px 40px', position: 'relative', zIndex: 1 }}>
          {(title || subtitle) && (
            <div style={{ marginBottom: '32px' }}>
              {title && <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em' }}>{title}</h1>}
              {subtitle && <p style={{ color: '#64748B', marginTop: '6px', fontSize: '14px' }}>{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
