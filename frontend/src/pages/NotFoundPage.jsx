import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg p-8">
    <div className="text-center">
      <div className="text-8xl mb-6">🍽️</div>
      <h1 className="font-display font-bold text-6xl text-gray-900 dark:text-white mb-4">404</h1>
      <h2 className="font-display font-semibold text-2xl text-gray-700 dark:text-gray-300 mb-3">Page Not Found</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
        Looks like this page went out for delivery and never came back. Let's get you back on track.
      </p>
      <Link to="/" className="btn-primary inline-flex items-center gap-2">
        <FiArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
