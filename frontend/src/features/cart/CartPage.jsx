import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../shared/api/client.js';
import { formatPrice, formatTime } from '../../shared/utils/helpers.js';

export default function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [diningMode, setDiningMode] = useState('takeaway');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.get('/cart').then((r) => r.data.data.cart),
  });

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings/canteen').then((r) => r.data.data.settings),
  });

  const updateMutation = useMutation({
    mutationFn: ({ cartItemId, data }) => api.patch(`/cart/items/${cartItemId}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (cartItemId) => api.delete(`/cart/items/${cartItemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const clearMutation = useMutation({
    mutationFn: () => api.delete('/cart'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const checkoutMutation = useMutation({
    mutationFn: (data) => api.patch('/cart/checkout-details', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: (err) => setCheckoutError(err.response?.data?.error?.message || 'Lỗi'),
  });

  const orderMutation = useMutation({
    mutationFn: () => api.post('/orders'),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setOrderSuccess(`Đặt hàng thành công! Mã đơn: ${res.data.data.order.orderNumber}`);
      setTimeout(() => navigate('/user/orders'), 2000);
    },
    onError: (err) => setCheckoutError(err.response?.data?.error?.message || 'Lỗi đặt hàng'),
  });

  const handleSetCheckoutDetails = () => {
    setCheckoutError('');
    if (!pickupDate || !pickupTime) {
      setCheckoutError('Vui lòng chọn ngày và giờ nhận hàng');
      return;
    }
    const isoString = new Date(`${pickupDate}T${pickupTime}:00`).toISOString();
    checkoutMutation.mutate({ diningMode, pickupTime: isoString });
  };

  const handleSubmitOrder = () => {
    setCheckoutError('');
    orderMutation.mutate();
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Đang tải giỏ hàng...</div>;
  }

  const cart = cartData || { items: [], subtotalAmount: 0, diningMode: null, pickupTime: null };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🛒 Giỏ hàng</h1>

      {orderSuccess && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4">{orderSuccess}</div>
      )}

      {cart.items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Giỏ hàng trống</p>
          <button onClick={() => navigate('/user')} className="mt-4 text-blue-600 hover:underline">
            Xem thực đơn
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {cart.items.map((item) => (
              <div key={item.cartItemId} className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{item.productNameSnapshot}</h3>
                    <p className="text-sm text-gray-500">{formatPrice(item.basePriceAmountSnapshot)} / món</p>
                    {item.selectedModifierGroups.map((mg) =>
                      mg.selectedModifiers.map((m) => (
                        <span key={m.modifierId} className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mr-1 mt-1">
                          {m.nameSnapshot} {m.priceAmountSnapshot > 0 ? `+${formatPrice(m.priceAmountSnapshot)}` : ''}
                        </span>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => removeMutation.mutate(item.cartItemId)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => updateMutation.mutate({ cartItemId: item.cartItemId, data: { quantity: Math.max(1, item.quantity - 1) } })}
                      className="px-2 py-1 text-gray-600 hover:bg-gray-100 text-sm"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateMutation.mutate({ cartItemId: item.cartItemId, data: { quantity: Math.min(99, item.quantity + 1) } })}
                      className="px-2 py-1 text-gray-600 hover:bg-gray-100 text-sm"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-semibold text-gray-800">{formatPrice(item.itemSubtotalAmount)}</span>
                </div>
              </div>
            ))}

            <button
              onClick={() => clearMutation.mutate()}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Xóa tất cả
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4 h-fit">
            <h3 className="font-semibold text-gray-800 mb-4">Thông tin đặt hàng</h3>

            {checkoutError && (
              <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg mb-3 text-sm">{checkoutError}</div>
            )}

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hình thức</label>
              <select
                value={diningMode}
                onChange={(e) => setDiningMode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="takeaway">Mang đi</option>
                <option value="eat_in">Ăn tại chỗ</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày nhận</label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Giờ nhận</label>
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {settingsData?.openingHours && (
              <div className="text-xs text-gray-400 mb-3">
                <p>Giờ mở cửa:</p>
                {settingsData.openingHours.filter((d) => d.isOpen).map((d) => {
                  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                  return (
                    <p key={d.dayOfWeek}>{days[d.dayOfWeek]}: {d.openTime} - {d.closeTime}</p>
                  );
                })}
              </div>
            )}

            <button
              onClick={handleSetCheckoutDetails}
              disabled={checkoutMutation.isPending}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium mb-2"
            >
              Cập nhật thông tin
            </button>

            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between text-lg font-bold text-gray-800 mb-4">
                <span>Tổng cộng</span>
                <span>{formatPrice(cart.subtotalAmount)}</span>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={orderMutation.isPending || !cart.diningMode}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
              >
                {orderMutation.isPending ? 'Đang đặt hàng...' : 'Đặt hàng (Tiền mặt)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}