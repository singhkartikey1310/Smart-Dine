import { useDispatch, useSelector } from 'react-redux';
import { FiBell, FiCheck } from 'react-icons/fi';
import { markAsRead, markAllAsRead } from '../../redux/slices/notificationSlice';
import { formatDistanceToNow } from '../../utils/dateUtils';

const NotificationDropdown = ({ onClose }) => {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state) => state.notification);

  const typeColors = {
    order: 'bg-blue-100 text-blue-600',
    payment: 'bg-green-100 text-green-600',
    promotion: 'bg-purple-100 text-purple-600',
    system: 'bg-gray-100 text-gray-600',
    review: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border z-50 animate-slide-down">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-border">
        <div className="flex items-center gap-2">
          <FiBell className="w-4 h-4 text-primary-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <span className="badge-orange">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => dispatch(markAllAsRead())}
            className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
          >
            <FiCheck className="w-3 h-3" /> Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
            No notifications yet
          </div>
        ) : (
          notifications.slice(0, 10).map((notif) => (
            <div
              key={notif._id}
              onClick={() => !notif.isRead && dispatch(markAsRead(notif._id))}
              className={`p-4 border-b border-gray-50 dark:border-dark-border last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors ${!notif.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
            >
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${typeColors[notif.type] || typeColors.system}`}>
                  {notif.type === 'order' ? '📦' : notif.type === 'payment' ? '💳' : '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatDistanceToNow(notif.createdAt)}
                  </p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
