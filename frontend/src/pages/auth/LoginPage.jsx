import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiMail, FiLock, FiEye, FiEyeOff, FiPhone, FiArrowLeft } from 'react-icons/fi';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../config/firebase';
import {
  loginUser,
  sendLoginOTP,
  verifyLoginOTP,
  firebasePhoneLogin,
} from '../../redux/slices/authSlice';
import toast from 'react-hot-toast';

// Login modes
const MODE = {
  SELECT: 'select',       // Choose password or OTP
  PASSWORD: 'password',   // Email + password
  OTP_SELECT: 'otp_select', // Choose email or phone OTP
  EMAIL_OTP: 'email_otp', // Enter email, get OTP
  EMAIL_OTP_VERIFY: 'email_otp_verify', // Enter OTP
  PHONE_OTP: 'phone_otp', // Enter phone number
  PHONE_OTP_VERIFY: 'phone_otp_verify', // Enter phone OTP
};

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, isAuthenticated } = useSelector((state) => state.auth);

  const [mode, setMode] = useState(MODE.SELECT);
  const [form, setForm] = useState({ email: '', password: '', phone: '', otp: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const recaptchaRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Password Login ──────────────────────────────────────────────────────────
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    dispatch(loginUser({ email: form.email, password: form.password }));
  };

  // ── Email OTP — Send ────────────────────────────────────────────────────────
  const handleSendEmailOTP = async (e) => {
    e.preventDefault();
    const result = await dispatch(sendLoginOTP(form.email));
    if (sendLoginOTP.fulfilled.match(result)) {
      setMode(MODE.EMAIL_OTP_VERIFY);
      setCountdown(60);
    }
  };

  // ── Email OTP — Verify ──────────────────────────────────────────────────────
  const handleVerifyEmailOTP = async (e) => {
    e.preventDefault();
    if (form.otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    const result = await dispatch(verifyLoginOTP({ email: form.email, otp: form.otp }));
    if (verifyLoginOTP.fulfilled.match(result)) {
      navigate(from, { replace: true });
    }
  };

  // ── Phone OTP — Send via Firebase ───────────────────────────────────────────
  const handleSendPhoneOTP = async (e) => {
    e.preventDefault();
    const phone = form.phone.trim();
    if (!/^\d{10}$/.test(phone)) { toast.error('Enter a valid 10-digit mobile number'); return; }

    try {
      // Setup reCAPTCHA
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
        });
      }

      const phoneWithCode = `+91${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, phoneWithCode, recaptchaVerifierRef.current);
      setConfirmationResult(confirmation);
      setMode(MODE.PHONE_OTP_VERIFY);
      setCountdown(60);
      toast.success(`OTP sent to +91 ${phone}`);
    } catch (err) {
      console.error('Firebase phone error:', err);
      // Reset reCAPTCHA on error
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      toast.error(err.message?.includes('invalid-phone') ? 'Invalid phone number' :
        err.message?.includes('too-many-requests') ? 'Too many attempts. Try later.' :
        'Failed to send OTP. Check Firebase config.');
    }
  };

  // ── Phone OTP — Verify via Firebase ─────────────────────────────────────────
  const handleVerifyPhoneOTP = async (e) => {
    e.preventDefault();
    if (!confirmationResult) { toast.error('Please request OTP first'); return; }
    if (form.otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }

    try {
      const result = await confirmationResult.confirm(form.otp);
      const firebaseToken = await result.user.getIdToken();
      const phone = form.phone.trim();

      const loginResult = await dispatch(firebasePhoneLogin({ firebaseToken, phone }));
      if (firebasePhoneLogin.fulfilled.match(loginResult)) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.code === 'auth/invalid-verification-code' ? 'Invalid OTP' :
        err.code === 'auth/code-expired' ? 'OTP expired. Request a new one.' :
        'Verification failed');
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    if (mode === MODE.EMAIL_OTP_VERIFY) {
      const result = await dispatch(sendLoginOTP(form.email));
      if (sendLoginOTP.fulfilled.match(result)) setCountdown(60);
    } else if (mode === MODE.PHONE_OTP_VERIFY) {
      setMode(MODE.PHONE_OTP);
      setConfirmationResult(null);
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-display font-bold text-xl text-gray-900 dark:text-white">
              Smart<span className="text-primary-500">Dine</span>
            </span>
          </Link>

          {/* Back button */}
          {mode !== MODE.SELECT && (
            <button
              onClick={() => {
                setForm((p) => ({ ...p, otp: '' }));
                if (mode === MODE.EMAIL_OTP_VERIFY) setMode(MODE.EMAIL_OTP);
                else if (mode === MODE.PHONE_OTP_VERIFY) setMode(MODE.PHONE_OTP);
                else setMode(MODE.SELECT);
              }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-500 mb-6 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" /> Back
            </button>
          )}

          {/* ── Mode: SELECT ── */}
          {mode === MODE.SELECT && (
            <>
              <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-2">Welcome back!</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-8">How would you like to sign in?</p>
              <div className="space-y-3">
                <button
                  onClick={() => setMode(MODE.PASSWORD)}
                  className="w-full flex items-center gap-4 p-4 card border-2 border-gray-100 dark:border-dark-border hover:border-primary-500 transition-all text-left"
                >
                  <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiLock className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Password</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sign in with email & password</p>
                  </div>
                </button>

                <button
                  onClick={() => setMode(MODE.OTP_SELECT)}
                  className="w-full flex items-center gap-4 p-4 card border-2 border-gray-100 dark:border-dark-border hover:border-primary-500 transition-all text-left"
                >
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🔐</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">OTP Login</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sign in with a one-time password</p>
                  </div>
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-500 font-medium hover:text-primary-600">Sign up</Link>
              </p>
            </>
          )}

          {/* ── Mode: OTP_SELECT ── */}
          {mode === MODE.OTP_SELECT && (
            <>
              <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">OTP Login</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Where should we send your OTP?</p>
              <div className="space-y-3">
                <button
                  onClick={() => setMode(MODE.EMAIL_OTP)}
                  className="w-full flex items-center gap-4 p-4 card border-2 border-gray-100 dark:border-dark-border hover:border-primary-500 transition-all text-left"
                >
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiMail className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Email OTP</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Send OTP to your email address</p>
                  </div>
                </button>

                <button
                  onClick={() => setMode(MODE.PHONE_OTP)}
                  className="w-full flex items-center gap-4 p-4 card border-2 border-gray-100 dark:border-dark-border hover:border-primary-500 transition-all text-left"
                >
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiPhone className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Mobile OTP</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Send OTP via SMS to your phone</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* ── Mode: PASSWORD ── */}
          {mode === MODE.PASSWORD && (
            <>
              <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">Sign in</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Enter your email and password</p>
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="you@example.com" required className="input-field pl-10" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <Link to="/forgot-password" className="text-sm text-primary-500 hover:text-primary-600">Forgot?</Link>
                  </div>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••" required className="input-field pl-10 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</span> : 'Sign In'}
                </button>
              </form>
            </>
          )}

          {/* ── Mode: EMAIL_OTP ── */}
          {mode === MODE.EMAIL_OTP && (
            <>
              <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">Email OTP</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Enter your registered email to receive an OTP</p>
              <form onSubmit={handleSendEmailOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="you@example.com" required className="input-field pl-10" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</span> : 'Send OTP'}
                </button>
              </form>
            </>
          )}

          {/* ── Mode: EMAIL_OTP_VERIFY ── */}
          {mode === MODE.EMAIL_OTP_VERIFY && (
            <>
              <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">Enter OTP</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-1">OTP sent to</p>
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-6">{form.email}</p>
              <form onSubmit={handleVerifyEmailOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">6-digit OTP</label>
                  <input
                    type="text"
                    value={form.otp}
                    onChange={(e) => setForm((p) => ({ ...p, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder="• • • • • •"
                    maxLength={6}
                    required
                    className="input-field text-center text-2xl font-bold tracking-[0.5em] py-4"
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={loading || form.otp.length !== 6} className="btn-primary w-full py-3">
                  {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying...</span> : 'Verify & Login'}
                </button>
              </form>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                {countdown > 0 ? `Resend in ${countdown}s` : <button onClick={handleResend} className="text-primary-500 font-medium hover:text-primary-600">Resend OTP</button>}
              </p>
            </>
          )}

          {/* ── Mode: PHONE_OTP ── */}
          {mode === MODE.PHONE_OTP && (
            <>
              <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">Mobile OTP</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Enter your registered mobile number</p>
              <form onSubmit={handleSendPhoneOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400">
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      placeholder="10-digit number"
                      maxLength={10}
                      required
                      className="input-field flex-1"
                    />
                  </div>
                </div>
                {/* Invisible reCAPTCHA container */}
                <div id="recaptcha-container" ref={recaptchaRef} />
                <button type="submit" disabled={loading || form.phone.length !== 10} className="btn-primary w-full py-3">
                  {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</span> : 'Send OTP via SMS'}
                </button>
              </form>
            </>
          )}

          {/* ── Mode: PHONE_OTP_VERIFY ── */}
          {mode === MODE.PHONE_OTP_VERIFY && (
            <>
              <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">Enter OTP</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-1">OTP sent to</p>
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-6">+91 {form.phone}</p>
              <form onSubmit={handleVerifyPhoneOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">6-digit OTP</label>
                  <input
                    type="text"
                    value={form.otp}
                    onChange={(e) => setForm((p) => ({ ...p, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    placeholder="• • • • • •"
                    maxLength={6}
                    required
                    className="input-field text-center text-2xl font-bold tracking-[0.5em] py-4"
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={loading || form.otp.length !== 6} className="btn-primary w-full py-3">
                  {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying...</span> : 'Verify & Login'}
                </button>
              </form>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                {countdown > 0 ? `Resend in ${countdown}s` : <button onClick={handleResend} className="text-primary-500 font-medium hover:text-primary-600">Resend OTP</button>}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-500 to-secondary-500 items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="text-8xl mb-6">🍽️</div>
          <h2 className="font-display font-bold text-3xl mb-4">Order Amazing Food</h2>
          <p className="text-white/80 text-lg max-w-sm">
            Discover restaurants, order your favorites, and track delivery in real-time.
          </p>
          <div className="flex justify-center gap-6 mt-8">
            {['500+ Restaurants', '10K+ Dishes', '4.8★ Rating'].map((stat) => (
              <div key={stat} className="text-center">
                <p className="font-bold text-xl">{stat.split(' ')[0]}</p>
                <p className="text-white/70 text-sm">{stat.split(' ').slice(1).join(' ')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
