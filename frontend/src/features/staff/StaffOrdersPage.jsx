import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../shared/api/client.js';
import { formatPrice, formatDate, getStatusColor, getStatusLabel } from '../../shared/utils/helpers.js';

const STATUSES = ['submitted', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];
const STATUS_LABELS = {
  submitted: 'Mới gửi',
  accepted: 'Đã nhận',
  preparing: 'Đang làm',
  ready: 'Sẵn sàng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const NEXT_STATUS = {
  submitted: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'completed',
};

export default function StaffOrdersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['allOrders'],
    queryFn: () => api.get('/orders', { params: { limit: 100 } }).then((r) => r.data.data),
    refetchInterval: 15000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }) => api.patch(`/orders/${orderId}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allOrders'] }),
  });

  const paymentMutation = useMutation({
    mutationFn: ({ paymentId, status }) => api.patch(`/payments/${paymentId}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allOrders'] }),
  });

  const handleNextStatus = async (order) => {
    const next = NEXT_STATUS[order.status];
    if (next) {
      statusMutation.mutate({ orderId: order._id, status: next });
    }
  };

  const handleCancel = (order) => {
    if (confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
      statusMutation.mutate({ orderId: order._id, status: 'cancelled' });
    }
  };

  const handleMarkPaid = async (order) => {
    try {
      const res = await api.get(`/orders/${order._id}/payment`);
      const payment = res.data.data.payment;
      paymentMutation.mutate({ paymentId: payment._id, status: 'paid' });
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Đang tải đơn hàng...</div>;
  }

  const orders = data || [];

  const ordersByStatus = {};
  STATUSES.forEach((s) => {
    ordersByStatus[s] = orders.filter((o) => o.status === s).sort((a, b) => new Date(a.pickupTime) - new Date(b.pickupTime));
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📋 Quản lý đơn hàng</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUSES.map((status) => (
          <div key={status} className="bg-gray-100 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-gray-700">{STATUS_LABELS[status]}</h3>
              <span className="text-xs bg-white px-2 py-0.5 rounded-full font-medium">
                {ordersByStatus[status].length}
              </span>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {ordersByStatus[status].map((order) => (
                <div key={order._id} className="bg-white rounded-lg shadow-sm p-3 text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-gray-800">{order.orderNumber}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
                      {getStatusLabel(order.paymentStatus)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{order.customerNameSnapshot}</p>
                  <p className="text-xs text-gray-500">
                    {getStatusLabel(order.diningMode)} • {formatDate(order.pickupTime)}
                  </p>
                  <div className="mt-1">
                    {order.items.map((item) => (
                      <p key={item.orderItemId} className="text-xs text-gray-600">
                        {item.quantity}x {item.productNameSnapshot}
                      </p>
                    ))}
                  </div>
                  <p className="font-semibold text-gray-800 mt-1">{formatPrice(order.totalAmount)}</p>

                  <div className="flex gap-1 mt-2 flex-wrap">
                    {NEXT_STATUS[order.status] && (
                      <button
                        onClick={() => handleNextStatus(order)}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        {STATUS_LABELS[NEXT_STATUS[order.status]]}
                      </button>
                    )}
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancel(order)}
                        className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                      >
                        Hủy
                      </button>
                    )}
                    {order.paymentStatus === 'pending' && (
                      <button
                        onClick={() => handleMarkPaid(order)}
                        className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs hover:bg-green-200"
                      >
                        Đã trả tiền
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}