import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const customerNav = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/my-loans', icon: '📋', label: 'My Loans' },
  { to: '/apply', icon: '➕', label: 'Apply for Loan' },
  { to: '/emi-calculator', icon: '🧮', label: 'EMI Calculator' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

const adminNav = [
  { to: '/admin', icon: '📊', label: 'System Dashboard' },
  { to: '/admin/loans', icon: '📋', label: 'Loan Reviews' },
  { to: '/admin/users', icon: '👥', label: 'Users' },
  { to: '/emi-calculator', icon: '🧮', label: 'EMI Calculator' },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const isAdmin = ['ADMIN', 'LOAN_OFFICER', 'MANAGER'].includes(user?.role);
  const navItems = isAdmin ? adminNav : customerNav;

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div style={{
      width: '260px', minHeight: '100vh', background: 'rgba(15,23,42,0.95)',
      borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex',
      flexDirection: 'column', padding: '24px 16px', position: 'sticky', top: 0,
      backdropFilter: 'blur(20px)', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '32px', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>💎</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: '#F1F5F9' }}>LoanVault</div>
            <div style={{ fontSize: '10px', color: '#475569', fontWeight: 500 }}>Professional LMS</div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>{user?.role}</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1 }}>
        <div style={{ fontSize: '10px', color: '#475569', fontWeight: 600, letterSpacing: '0.1em', marginBottom: '8px', padding: '0 8px' }}>NAVIGATION</div>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/admin' || item.to === '/dashboard'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
              borderRadius: '10px', marginBottom: '4px', textDecoration: 'none',
              fontSize: '14px', fontWeight: 500, transition: 'all 0.2s',
              background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
              color: isActive ? '#60A5FA' : '#94A3B8',
              border: isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
            })}>
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button onClick={handleLogout} style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
        borderRadius: '10px', background: 'rgba(239,68,68,0.08)', color: '#F87171',
        border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer', width: '100%',
        fontSize: '14px', fontWeight: 500, transition: 'all 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}>
        <span>🚪</span> Logout
      </button>
    </div>
  );
}
