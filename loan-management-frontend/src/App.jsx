import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import CustomerDashboard from './pages/customer/Dashboard';
import MyLoansPage from './pages/customer/MyLoansPage';
import ApplyLoanPage from './pages/customer/ApplyLoanPage';
import EMICalculatorPage from './pages/customer/EMICalculatorPage';
import LoanDetailPage from './pages/customer/LoanDetailPage';
import ProfilePage from './pages/customer/ProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLoansPage from './pages/admin/AdminLoansPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useSelector(s => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useSelector(s => s.auth);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Customer */}
      <Route path="/dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/my-loans" element={<ProtectedRoute><MyLoansPage /></ProtectedRoute>} />
      <Route path="/my-loans/:loanId" element={<ProtectedRoute><LoanDetailPage /></ProtectedRoute>} />
      <Route path="/apply" element={<ProtectedRoute><ApplyLoanPage /></ProtectedRoute>} />
      <Route path="/emi-calculator" element={<ProtectedRoute><EMICalculatorPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Admin / Officers */}
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN','LOAN_OFFICER','MANAGER']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/loans" element={<ProtectedRoute roles={['ADMIN','LOAN_OFFICER','MANAGER']}><AdminLoansPage /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
