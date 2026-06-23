import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../../shared/api/client.js';
import { formatPrice, formatDate, getStatusColor, getStatusLabel } from '../../shared/utils/helpers.js';

export default function UserOrderDetailPage() {
  const { orderId } = useParams();

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.get(`/orders/my/${orderId}`).then((r) => r.data.data.order),
  });

  const { data: paymentData } = useQuery({
    queryKey: ['payment', orderId],
    queryFn: () => api.get(`/orders/${orderId}/payment`).then((r) => r.data.data.payment),
    enabled: !!orderId,
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Đang tải chi tiết đơn hàng...</div>;
  }

  if (!orderData) {
    return <div className="text-center py-12 text-gray-500">Không tìm thấy đơn hàng.</div>;
  }

  return (
    <div>
      <Link to="/user/orders" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        ← Quay lại danh sách
      </Link>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{orderData.orderNumber}</h1>
            <p className="text-sm text-gray-500">{formatDate(orderData.createdAt)}</p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderData.status)}`}>
              {getStatusLabel(orderData.status)}
            </span>
            {paymentData && (
              <p className="mt-2">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(paymentData.status)}`}>
                  {getStatusLabel(paymentData.status)}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <span className="text-gray-500">Hình thức:</span>{' '}
            <span className="font-medium">{getStatusLabel(orderData.diningMode)}</span>
          </div>
          <div>
            <span className="text-gray-500">Giờ nhận:</span>{' '}
            <span className="font-medium">{formatDate(orderData.pickupTime)}</span>
          </div>
          <div>
            <span className="text-gray-500">Thanh toán:</span>{' '}
            <span className="font-medium">{getStatusLabel(orderData.paymentMethod)}</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-800 mb-3">Món đã đặt</h3>
          <div className="space-y-2">
            {orderData.items.map((item) => (
              <div key={item.orderItemId} className="flex justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-800">
                    {item.quantity}x {item.productNameSnapshot}
                  </p>
                  {item.selectedModifierGroups.map((mg) =>
                    mg.selectedModifiers.map((m) => (
                      <span key={m.modifierId} className="text-xs text-gray-500 mr-2">
                        {m.nameSnapshot}
                      </span>
                    ))
                  )}
                </div>
                <span className="font-medium">{formatPrice(item.itemSubtotalAmount)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-lg font-bold mt-4 pt-3 border-t">
            <span>Tổng cộng</span>
            <span>{formatPrice(orderData.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}