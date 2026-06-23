import { useQuery } from '@tanstack/react-query';
import api from '../../shared/api/client.js';
import { formatPrice } from '../../shared/utils/helpers.js';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/summary').then((r) => r.data.data),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Đang tải dashboard...</div>;
  }

  const summary = data || {};

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Tổng đơn hàng</p>
          <p className="text-3xl font-bold text-gray-800">{summary.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Doanh thu tiền mặt</p>
          <p className="text-3xl font-bold text-green-600">{formatPrice(summary.cashRevenueAmount || 0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Người dùng</p>
          <p className="text-3xl font-bold text-blue-600">{summary.activeUsers || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Nhân viên/Admin</p>
          <p className="text-3xl font-bold text-purple-600">{summary.activeStaff || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Đơn hàng theo trạng thái</h3>
          {summary.ordersByStatus && Object.keys(summary.ordersByStatus).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(summary.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{status}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Top sản phẩm</h3>
          {summary.topProducts && summary.topProducts.length > 0 ? (
            <div className="space-y-2">
              {summary.topProducts.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {i + 1}. {p.productName} <span className="text-gray-400">(x{p.totalQuantity})</span>
                  </span>
                  <span className="font-medium">{formatPrice(p.totalRevenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
          )}
        </div>
      </div>
    </div>
  );
}