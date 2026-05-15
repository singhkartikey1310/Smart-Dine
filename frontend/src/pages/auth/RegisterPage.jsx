import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff,
  FiMapPin, FiArrowLeft, FiArrowRight, FiCheck,
} from 'react-icons/fi';
import { registerUser } from '../../redux/slices/authSlice';
import toast from 'react-hot-toast';

// Registration steps
const STEP = { ROLE: 'role', FORM: 'form' };

const ROLES = [
  {
    value: 'customer',
    label: 'Customer',
    icon: '🛒',
    desc: 'Order food, track deliveries, earn rewards',
    color: 'from-blue-500 to-blue-600',
    features: ['Browse restaurants', 'Place orders', 'Track delivery', 'Reviews & ratings'],
  },
  {
    value: 'restaurant_admin',
    label: 'Restaurant Owner',
    icon: '🍽️',
    desc: 'List your restaurant, manage menu & orders',
    color: 'from-primary-500 to-secondary-500',
    features: ['Add your restaurant', 'Manage menu & dishes', 'Accept orders', 'View analytics'],
  },
];

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useSelector((state) => state.auth);

  const [step, setStep] = useState(STEP.ROLE);
  const [selectedRole, setSelectedRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // Common fields
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    // Restaurant-specific
    restaurantName: '', ownerName: '', gstNumber: '',
    restaurantPhone: '', receptionistPhone: '',
    restaurantStreet: '', restaurantCity: '', restaurantState: '', restaurantPincode: '',
  });

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep(STEP.FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');

    const payload = { ...form, role: selectedRole };
    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) {
      navigate('/verify-otp', { state: { email: form.email, role: selectedRole } });
    }
  };

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  // ── Step 1: Role Selection ──────────────────────────────────────────────────
  if (step === STEP.ROLE) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="font-display font-bold text-2xl text-gray-900 dark:text-white">
              Smart<span className="text-primary-500">Dine</span>
            </span>
          </Link>

          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-2">
              Join SmartDine AI
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Who are you? Choose your account type to get started.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {ROLES.map((role) => (
              <button
                key={role.value}
                onClick={() => handleRoleSelect(role.value)}
                className="card p-6 text-left hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 border-2 border-transparent hover:border-primary-300 dark:hover:border-primary-700 group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  {role.icon}
                </div>
                <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-1">
                  {role.label}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{role.desc}</p>
                <ul className="space-y-1.5">
                  {role.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <FiCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-1 mt-4 text-primary-500 text-sm font-medium">
                  Get started <FiArrowRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>

          {/* Admin note */}
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
            Admin accounts are created by the system administrator only.
          </p>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 font-medium hover:text-primary-600">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Step 2: Registration Form ───────────────────────────────────────────────
  const isRestaurant = selectedRole === 'restaurant_admin';

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className={`hidden lg:flex flex-1 bg-gradient-to-br ${isRestaurant ? 'from-primary-500 to-secondary-500' : 'from-blue-500 to-blue-700'} items-center justify-center p-12`}>
        <div className="text-center text-white">
          <div className="text-8xl mb-6">{isRestaurant ? '🍽️' : '🛒'}</div>
          <h2 className="font-display font-bold text-3xl mb-4">
            {isRestaurant ? 'List Your Restaurant' : 'Join SmartDine AI'}
          </h2>
          <p className="text-white/80 text-lg max-w-sm">
            {isRestaurant
              ? 'Reach thousands of hungry customers. Manage orders, menu, and grow your business.'
              : 'Discover amazing restaurants, order your favorites, and track delivery in real-time.'}
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-start justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg py-4">
          {/* Logo + back */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-display font-bold text-lg text-gray-900 dark:text-white">
                Smart<span className="text-primary-500">Dine</span>
              </span>
            </Link>
            <button
              onClick={() => setStep(STEP.ROLE)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-500 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" /> Change role
            </button>
          </div>

          {/* Role badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${isRestaurant ? 'from-primary-500 to-secondary-500' : 'from-blue-500 to-blue-600'}`}>
              {isRestaurant ? '🍽️ Restaurant Owner' : '🛒 Customer'}
            </span>
          </div>

          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">
            Create your account
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {isRestaurant ? 'Fill in your details and restaurant information' : 'Join thousands of food lovers today'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── Common Fields ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="text" value={form.name} onChange={set('name')} placeholder="John Doe" required className="input-field pl-10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone *</label>
                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="tel" value={form.phone} onChange={set('phone')} placeholder="10-digit number" required className="input-field pl-10" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address *</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required className="input-field pl-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password *</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    className="input-field pl-10 pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" required className="input-field pl-10" />
                </div>
              </div>
            </div>

            {/* ── Restaurant-specific Fields ── */}
            {isRestaurant && (
              <>
                <div className="border-t border-gray-100 dark:border-dark-border pt-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">R</span>
                    Restaurant Details
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Restaurant Name *</label>
                        <input type="text" value={form.restaurantName} onChange={set('restaurantName')} placeholder="e.g. Spice Garden" required={isRestaurant} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Owner Name *</label>
                        <input type="text" value={form.ownerName} onChange={set('ownerName')} placeholder="Restaurant owner's name" className="input-field" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">GST Number</label>
                        <input type="text" value={form.gstNumber} onChange={set('gstNumber')} placeholder="22AAAAA0000A1Z5" maxLength={15} className="input-field uppercase" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Restaurant Phone *</label>
                        <div className="relative">
                          <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input type="tel" value={form.restaurantPhone} onChange={set('restaurantPhone')} placeholder="Restaurant contact number" required={isRestaurant} className="input-field pl-10" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Receptionist Phone</label>
                      <div className="relative">
                        <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input type="tel" value={form.receptionistPhone} onChange={set('receptionistPhone')} placeholder="Front desk / receptionist number" className="input-field pl-10" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Restaurant Address */}
                <div className="border-t border-gray-100 dark:border-dark-border pt-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                    <FiMapPin className="w-4 h-4 text-primary-500" />
                    Restaurant Address
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Street Address *</label>
                      <input type="text" value={form.restaurantStreet} onChange={set('restaurantStreet')} placeholder="Shop no., Street, Area" required={isRestaurant} className="input-field" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">City *</label>
                        <input type="text" value={form.restaurantCity} onChange={set('restaurantCity')} placeholder="City" required={isRestaurant} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">State *</label>
                        <input type="text" value={form.restaurantState} onChange={set('restaurantState')} placeholder="State" required={isRestaurant} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pincode *</label>
                        <input type="text" value={form.restaurantPincode} onChange={set('restaurantPincode')} placeholder="6-digit" maxLength={6} required={isRestaurant} className="input-field" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending approval notice */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">⏳ Pending Admin Approval</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-1">
                    Your restaurant will be reviewed by our team before going live. You'll be notified once approved.
                  </p>
                </div>
              </>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                isRestaurant ? 'Register Restaurant' : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 font-medium hover:text-primary-600">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
