const statusConfig = {
  pending: { label: 'Pending', class: 'badge-yellow' },
  accepted: { label: 'Accepted', class: 'badge-blue' },
  preparing: { label: 'Preparing', class: 'badge-orange' },
  out_for_delivery: { label: 'Out for Delivery', class: 'badge-blue' },
  delivered: { label: 'Delivered', class: 'badge-green' },
  cancelled: { label: 'Cancelled', class: 'badge-red' },
};

const OrderStatusBadge = ({ status }) => {
  const config = statusConfig[status] || { label: status, class: 'badge-yellow' };
  return <span className={`badge ${config.class} capitalize`}>{config.label}</span>;
};

export default OrderStatusBadge;
