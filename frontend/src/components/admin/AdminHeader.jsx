import { useDispatch, useSelector } from 'react-redux';
import { FiMenu, FiSun, FiMoon, FiBell } from 'react-icons/fi';
import { toggleTheme } from '../../redux/slices/uiSlice';

const AdminHeader = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.ui);
  const { unreadCount } = useSelector((state) => state.notification);

  return (
    <header className="h-16 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border flex items-center justify-between px-6 flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
      >
        <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch(toggleTheme())}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors text-gray-500 dark:text-gray-400"
        >
          {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
        </button>
        <button className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors text-gray-500 dark:text-gray-400">
          <FiBell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
