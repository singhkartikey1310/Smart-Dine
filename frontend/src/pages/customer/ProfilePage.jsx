import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiUser, FiMail, FiPhone, FiSave } from 'react-icons/fi';
import { updateProfile } from '../../redux/slices/authSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [activeTab, setActiveTab] = useState('profile');

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', form.name);
    if (form.phone) formData.append('phone', form.phone);
    dispatch(updateProfile(formData));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'addresses', label: 'Addresses' },
  ];

  return (
    <div className="page-container py-8">
      <h1 className="section-title mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-6 text-center">
            {/* Avatar — initials only, no upload */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-3xl">
                {user?.name?.[0]?.toUpperCase()}
              </span>
            </div>

            <h2 className="font-semibold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            <span className={`badge mt-2 ${
              user?.role === 'super_admin' ? 'badge-red' :
              user?.role === 'restaurant_admin' ? 'badge-blue' : 'badge-green'
            }`}>
              {user?.role?.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="card mt-4 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-gray-50 dark:border-dark-border last:border-0 ${
                  activeTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Personal Information</h2>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      className="input-field pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      value={user?.email}
                      disabled
                      className="input-field pl-10 opacity-60 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="10-digit mobile number"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                {['currentPassword', 'newPassword', 'confirmPassword'].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      type="password"
                      value={passwordForm[field]}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, [field]: e.target.value }))}
                      className="input-field"
                      required
                    />
                  </div>
                ))}
                <button type="submit" className="btn-primary">Update Password</button>
              </form>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Saved Addresses</h2>
              {!user?.addresses?.length ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No saved addresses yet.</p>
              ) : (
                <div className="space-y-3">
                  {user.addresses.map((addr, i) => (
                    <div key={i} className="p-4 border border-gray-200 dark:border-dark-border rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="badge-blue">{addr.label}</span>
                        {addr.isDefault && <span className="badge-green">Default</span>}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
