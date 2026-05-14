import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiSave, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { updateProfile, logoutUser } from '../../redux/slices/authSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// Delete account steps
const DELETE_STEP = { IDLE: 'idle', CONFIRM: 'confirm', OTP: 'otp', DELETING: 'deleting' };

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [activeTab, setActiveTab] = useState('profile');

  // Delete account state
  const [deleteStep, setDeleteStep] = useState(DELETE_STEP.IDLE);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

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

  // ── Delete Account ──────────────────────────────────────────────────────────
  const handleSendDeleteOTP = async () => {
    setSendingOtp(true);
    try {
      const { data } = await api.post('/auth/delete-account/send-otp');
      toast.success(data.message);
      setDeleteStep(DELETE_STEP.OTP);
      setCountdown(60);
      // Countdown timer
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    if (deleteOtp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    setDeleteStep(DELETE_STEP.DELETING);
    try {
      await api.delete('/auth/delete-account', { data: { otp: deleteOtp } });
      toast.success('Account deleted successfully');
      dispatch(logoutUser());
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
      setDeleteStep(DELETE_STEP.OTP);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'addresses', label: 'Addresses' },
    { id: 'danger', label: '⚠️ Danger Zone' },
  ];

  return (
    <div className="page-container py-8">
      <h1 className="section-title mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-6 text-center">
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
                    ? tab.id === 'danger'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : tab.id === 'danger'
                    ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10'
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
          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Personal Information</h2>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input-field pl-10" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="email" value={user?.email} disabled className="input-field pl-10 opacity-60 cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="10-digit mobile number" className="input-field pl-10" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : <><FiSave className="w-4 h-4" />Save Changes</>}
                </button>
              </form>
            </div>
          )}

          {/* ── Security Tab ── */}
          {activeTab === 'security' && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                {['currentPassword', 'newPassword', 'confirmPassword'].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 capitalize">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input type="password" value={passwordForm[field]} onChange={(e) => setPasswordForm((p) => ({ ...p, [field]: e.target.value }))} className="input-field" required />
                  </div>
                ))}
                <button type="submit" className="btn-primary">Update Password</button>
              </form>
            </div>
          )}

          {/* ── Addresses Tab ── */}
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

          {/* ── Danger Zone Tab ── */}
          {activeTab === 'danger' && (
            <div className="space-y-4">
              <div className="card p-6 border-2 border-red-200 dark:border-red-800/40">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiTrash2 className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">Delete Account</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Permanently delete your SmartDine account and all associated data including orders, reviews, and saved addresses. <strong className="text-red-500">This action cannot be undone.</strong>
                    </p>

                    {/* Step: IDLE */}
                    {deleteStep === DELETE_STEP.IDLE && (
                      <button
                        onClick={() => setDeleteStep(DELETE_STEP.CONFIRM)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        Delete My Account
                      </button>
                    )}

                    {/* Step: CONFIRM */}
                    {deleteStep === DELETE_STEP.CONFIRM && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FiAlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Are you absolutely sure?</p>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-400/80 mb-4">
                          We'll send a confirmation OTP to <strong>{user?.email}</strong>. You must enter it to proceed.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={handleSendDeleteOTP}
                            disabled={sendingOtp}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                          >
                            {sendingOtp ? (
                              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending OTP...</>
                            ) : (
                              <>Send Confirmation OTP</>
                            )}
                          </button>
                          <button
                            onClick={() => setDeleteStep(DELETE_STEP.IDLE)}
                            className="px-4 py-2 bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step: OTP */}
                    {deleteStep === DELETE_STEP.OTP && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-4">
                        <p className="text-sm text-red-600 dark:text-red-400 mb-1">
                          OTP sent to <strong>{user?.email}</strong>
                        </p>
                        <p className="text-xs text-red-500/70 dark:text-red-400/60 mb-4">Valid for 10 minutes</p>
                        <form onSubmit={handleConfirmDelete} className="space-y-3">
                          <input
                            type="text"
                            value={deleteOtp}
                            onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            required
                            autoFocus
                            className="input-field text-center text-xl font-bold tracking-[0.4em] py-3 border-red-300 dark:border-red-700 focus:ring-red-400"
                          />
                          <div className="flex gap-3">
                            <button
                              type="submit"
                              disabled={deleteOtp.length !== 6 || deleteStep === DELETE_STEP.DELETING}
                              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                            >
                              {deleteStep === DELETE_STEP.DELETING ? (
                                <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Deleting...</>
                              ) : (
                                <><FiTrash2 className="w-3.5 h-3.5" />Confirm Delete</>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setDeleteStep(DELETE_STEP.IDLE); setDeleteOtp(''); }}
                              className="px-4 py-2 bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                          {countdown > 0 && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">Resend available in {countdown}s</p>
                          )}
                          {countdown === 0 && (
                            <button
                              type="button"
                              onClick={handleSendDeleteOTP}
                              disabled={sendingOtp}
                              className="text-xs text-red-500 hover:text-red-600 font-medium"
                            >
                              {sendingOtp ? 'Sending...' : 'Resend OTP'}
                            </button>
                          )}
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
