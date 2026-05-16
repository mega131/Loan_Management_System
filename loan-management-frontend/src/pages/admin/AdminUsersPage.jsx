import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUsers } from '../../store/slices/loanSlice';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const dispatch = useDispatch();
  const { users, loading } = useSelector(s => s.loans);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const filteredUsers = users.filter(u => 
    [u.firstName, u.lastName, u.email, u.username, u.role].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.put(`/loans/admin/users/${userId}/role`, { role: newRole });
      toast.success('User role updated');
      dispatch(fetchAllUsers());
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleUpdateKYC = async (userId, newStatus) => {
    try {
      await api.put(`/loans/admin/users/${userId}/kyc`, { kycStatus: newStatus });
      toast.success('KYC status updated');
      dispatch(fetchAllUsers());
    } catch (err) {
      toast.error('Failed to update KYC');
    }
  };

  return (
    <Layout title="User Management" subtitle="Manage system users, roles, and KYC verification">
      <div style={{ marginBottom: '24px' }}>
        <input 
          className="input-dark" 
          placeholder="🔍 Search users by name, email, or role..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '16px', color: '#64748B', fontWeight: 600 }}>User</th>
              <th style={{ padding: '16px', color: '#64748B', fontWeight: 600 }}>Role</th>
              <th style={{ padding: '16px', color: '#64748B', fontWeight: 600 }}>KYC Status</th>
              <th style={{ padding: '16px', color: '#64748B', fontWeight: 600 }}>Joined</th>
              <th style={{ padding: '16px', color: '#64748B', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>No users found</td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#F1F5F9' }}>{user.firstName} {user.lastName}</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <select 
                      value={user.role} 
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', outline: 'none' }}
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="LOAN_OFFICER">LOAN_OFFICER</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <StatusBadge status={user.kycStatus} />
                  </td>
                  <td style={{ padding: '16px', color: '#94A3B8' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {user.kycStatus === 'PENDING' && (
                        <>
                          <button className="btn-success" onClick={() => handleUpdateKYC(user.id, 'VERIFIED')} style={{ fontSize: '11px', padding: '4px 8px' }}>Verify</button>
                          <button className="btn-danger" onClick={() => handleUpdateKYC(user.id, 'REJECTED')} style={{ fontSize: '11px', padding: '4px 8px' }}>Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
