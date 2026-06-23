import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../shared/api/client.js';
import { formatPrice, formatDate, getStatusColor, getStatusLabel } from '../../shared/utils/helpers.js';

export default function UserOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: () => api.get('/orders/my').then((r) => r.data),
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Đang tải đơn hàng...</div>;
  }

  const orders = data?.data || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📋 Đơn hàng của tôi</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Chưa có đơn hàng nào.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/user/orders/${order._id}`}
              className="block bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  <p className="text-sm text-gray-500">
                    {getStatusLabel(order.diningMode)} • Nhận lúc {formatDate(order.pickupTime)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  <p className="font-semibold text-gray-800 mt-1">{formatPrice(order.totalAmount)}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(order.paymentStatus)}`}>
                    {getStatusLabel(order.paymentStatus)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}