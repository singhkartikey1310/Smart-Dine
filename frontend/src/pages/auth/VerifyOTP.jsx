import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { verifyOTP } from '../../redux/slices/authSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const VerifyOTP = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, isAuthenticated } = useSelector((state) => state.auth);

  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const email = location.state?.email;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  // Redirect if no email passed (direct URL access)
  useEffect(() => {
    if (!email) navigate('/register', { replace: true });
  }, [email, navigate]);

  // Countdown for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    const result = await dispatch(verifyOTP({ email, otp: otp.trim() }));
    if (verifyOTP.fulfilled.match(result)) {
      navigate('/', { replace: true });
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('New OTP sent to your email!');
      setCountdown(60);
      setOtp('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="font-display font-bold text-xl text-gray-900 dark:text-white">
            Smart<span className="text-primary-500">Dine</span>
          </span>
        </Link>

        <div className="card p-8">
          {/* Icon */}
          <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📧</span>
          </div>

          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white text-center mb-2">
            Verify your email
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-1">
            We sent a 6-digit OTP to
          </p>
          <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm text-center mb-8">
            {email}
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                maxLength={6}
                required
                className="input-field text-center text-2xl font-bold tracking-[0.5em] py-4"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify OTP'
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Didn't receive the OTP?{' '}
              {countdown > 0 ? (
                <span className="text-gray-400 dark:text-gray-500">
                  Resend in {countdown}s
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-primary-500 font-medium hover:text-primary-600 transition-colors"
                >
                  {resending ? 'Sending...' : 'Resend OTP'}
                </button>
              )}
            </p>
          </div>

          <div className="text-center mt-4">
            <Link to="/register" className="text-sm text-gray-400 dark:text-gray-500 hover:text-primary-500 transition-colors">
              ← Back to Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
