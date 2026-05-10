import { FiCheck } from 'react-icons/fi';

const STEPS = [
  { key: 'pending', label: 'Order Placed', icon: '📋' },
  { key: 'accepted', label: 'Accepted', icon: '✅' },
  { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🛵' },
  { key: 'delivered', label: 'Delivered', icon: '🎉' },
];

const OrderTracker = ({ status, statusHistory }) => {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
        <span className="text-2xl">❌</span>
        <div>
          <p className="font-semibold text-red-600 dark:text-red-400">Order Cancelled</p>
          <p className="text-sm text-red-500 dark:text-red-400/70">
            {statusHistory?.find((h) => h.status === 'cancelled')?.note || 'Order was cancelled'}
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 dark:bg-dark-border" />
      <div
        className="absolute top-6 left-6 h-0.5 bg-primary-500 transition-all duration-500"
        style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
      />

      <div className="relative flex justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const historyItem = statusHistory?.find((h) => h.status === step.key);

          return (
            <div key={step.key} className="flex flex-col items-center gap-2 flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 transition-all z-10 ${
                  isCompleted
                    ? 'bg-primary-500 border-primary-500 text-white'
                    : isCurrent
                    ? 'bg-white dark:bg-dark-card border-primary-500 shadow-glow'
                    : 'bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border'
                }`}
              >
                {isCompleted ? <FiCheck className="w-5 h-5" /> : step.icon}
              </div>
              <div className="text-center">
                <p className={`text-xs font-medium ${isCurrent ? 'text-primary-500' : isCompleted ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                  {step.label}
                </p>
                {historyItem && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {new Date(historyItem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTracker;
