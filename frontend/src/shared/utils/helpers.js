export function formatPrice(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

export function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('vi-VN');
}

export function formatTime(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function getStatusColor(status) {
  const colors = {
    submitted: 'bg-blue-100 text-blue-800',
    accepted: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-orange-100 text-orange-800',
    ready: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    active: 'bg-green-100 text-green-800',
    disabled: 'bg-red-100 text-red-800',
    available: 'bg-green-100 text-green-800',
    unavailable: 'bg-yellow-100 text-yellow-800',
    hidden: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status) {
  const labels = {
    submitted: 'Đã gửi',
    accepted: 'Đã nhận',
    preparing: 'Đang chuẩn bị',
    ready: 'Sẵn sàng',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    pending: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    active: 'Hoạt động',
    disabled: 'Vô hiệu',
    available: 'Có sẵn',
    unavailable: 'Không có sẵn',
    hidden: 'Ẩn',
    takeaway: 'Mang đi',
    eat_in: 'Ăn tại chỗ',
    cash: 'Tiền mặt',
  };
  return labels[status] || status;
}