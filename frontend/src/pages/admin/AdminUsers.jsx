import { useEffect, useState } from 'react';
import { FiSearch, FiTrash2, FiUserCheck, FiUserX, FiShield, FiAlertTriangle } from 'react-icons/fi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ROLE_LABELS = {
  customer: { label: 'Customer', badge: 'badge-green', icon: '🛒' },
  restaurant_admin: { label: 'Restaurant Owner', badge: 'badge-blue', icon: '🍽️' },
  super_admin: { label: 'Admin', badge: 'badge-red', icon: '⚙️' },
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ keyword: '', role: '', page: 1 });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: filters });
      setUsers(data.users);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filters.role, filters.page]);

  const handleSearch = (e) => { e.preventDefault(); fetchUsers(); };

  // Block / Unblock user
  const toggleActive = async (userId, isActive, userName) => {
    try {
      await api.put(`/admin/users/${userId}`, { isActive: !isActive });
      toast.success(`${userName} ${isActive ? 'blocked' : 'unblocked'} successfully`);
      fetchUsers();
    } catch {
      toast.error('Failed to update user');
    }
  };

  // Mark as spam (block + flag)
  const markSpam = async (userId, userName) => {
    if (!window.confirm(`Mark ${userName} as spam and block their account?`)) return;
    try {
      await api.put(`/admin/users/${userId}`, { isActive: false });
      toast.success(`${userName} marked as spam and blocked`);
      fetchUsers();
    } catch {
      toast.error('Failed to mark as spam');
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted permanently');
      setConfirmDelete(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Stats by role
  const stats = {
    total,
    customers: users.filter((u) => u.role === 'customer').length,
    restaurants: users.filter((u) => u.role === 'restaurant_admin').length,
    blocked: users.filter((u) => !u.isActive).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{total} total users</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600', icon: '👥' },
          { label: 'Customers', value: stats.customers, color: 'bg-green-50 dark:bg-green-900/20 text-green-600', icon: '🛒' },
          { label: 'Restaurant Owners', value: stats.restaurants, color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600', icon: '🍽️' },
          { label: 'Blocked', value: stats.blocked, color: 'bg-red-50 dark:bg-red-900/20 text-red-600', icon: '🚫' },
        ].map((s) => (
          <div key={s.label} className={`card p-4 ${s.color}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-bold text-xl">{s.value}</div>
            <div className="text-xs font-medium opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex gap-3 flex-1">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters((p) => ({ ...p, keyword: e.target.value }))}
              placeholder="Search by name or email..."
              className="input-field pl-9"
            />
          </div>
          <button type="submit" className="btn-primary px-4">Search</button>
        </form>
        <select
          value={filters.role}
          onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value, page: 1 }))}
          className="input-field w-full sm:w-52"
        >
          <option value="">All Roles</option>
          <option value="customer">🛒 Customers</option>
          <option value="restaurant_admin">🍽️ Restaurant Owners</option>
          <option value="super_admin">⚙️ Admins</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border">
              <tr>
                {['User', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>{Array(7).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 shimmer rounded" /></td>)}</tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">No users found</td></tr>
              ) : (
                users.map((user) => {
                  const roleInfo = ROLE_LABELS[user.role] || { label: user.role, badge: 'badge-yellow', icon: '👤' };
                  return (
                    <tr key={user._id} className={`hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors ${!user.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {user.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                            {!user.isActive && <span className="text-xs text-red-500 font-medium">🚫 Blocked</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${roleInfo.badge} capitalize`}>
                          {roleInfo.icon} {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>
                          {user.isActive ? '● Active' : '● Blocked'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Block / Unblock */}
                          <button
                            onClick={() => toggleActive(user._id, user.isActive, user.name)}
                            className={`p-1.5 rounded-lg transition-colors ${user.isActive ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                            title={user.isActive ? 'Block user' : 'Unblock user'}
                          >
                            {user.isActive ? <FiUserX className="w-4 h-4" /> : <FiUserCheck className="w-4 h-4" />}
                          </button>

                          {/* Mark as spam (only for customers) */}
                          {user.role === 'customer' && user.isActive && (
                            <button
                              onClick={() => markSpam(user._id, user.name)}
                              className="p-1.5 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                              title="Mark as spam & block"
                            >
                              <FiAlertTriangle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete */}
                          {user.role !== 'super_admin' && (
                            <button
                              onClick={() => setConfirmDelete(user)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete user permanently"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white dark:bg-dark-card rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTrash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-center mb-2">Delete User?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Permanently delete <strong>{confirmDelete.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => deleteUser(confirmDelete._id)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors text-sm">
                Delete
              </button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
