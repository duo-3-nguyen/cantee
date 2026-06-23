import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../shared/api/client.js';
import { formatPrice } from '../../shared/utils/helpers.js';

export default function UserHomePage() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((r) => r.data.data),
  });

  const addMutation = useMutation({
    mutationFn: (item) => api.post('/cart/items', item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setSelectedProduct(null);
      setSelectedModifiers({});
      setQuantity(1);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.error?.message || 'Lỗi thêm vào giỏ hàng');
    },
  });

  const openCustomize = (product) => {
    setSelectedProduct(product);
    setError('');
    const defaults = {};
    product.modifierGroups.forEach((group) => {
      defaults[group.groupId] = [...group.defaultModifierIds];
    });
    setSelectedModifiers(defaults);
    setQuantity(1);
  };

  const toggleModifier = (groupId, modifierId, maxSelected) => {
    setSelectedModifiers((prev) => {
      const current = prev[groupId] || [];
      if (current.includes(modifierId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== modifierId) };
      }
      if (current.length >= maxSelected) {
        return { ...prev, [groupId]: [...current.slice(1), modifierId] };
      }
      return { ...prev, [groupId]: [...current, modifierId] };
    });
  };

  const calculateItemPrice = () => {
    if (!selectedProduct) return 0;
    let modifierTotal = 0;
    selectedProduct.modifierGroups.forEach((group) => {
      const selected = selectedModifiers[group.groupId] || [];
      group.modifiers.forEach((mod) => {
        if (selected.includes(mod.modifierId)) {
          modifierTotal += mod.priceAmount;
        }
      });
    });
    return quantity * (selectedProduct.basePriceAmount + modifierTotal);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const selectedModifierGroups = selectedProduct.modifierGroups.map((group) => ({
      groupId: group.groupId,
      selectedModifiers: (selectedModifiers[group.groupId] || []).map((modId) => ({ modifierId: modId })),
    }));
    addMutation.mutate({
      productId: selectedProduct._id,
      quantity,
      selectedModifierGroups,
    });
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Đang tải thực đơn...</div>;
  }

  const products = data || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🍽️ Thực đơn hôm nay</h1>

      {products.length === 0 && (
        <div className="text-center py-12 text-gray-500">Chưa có món ăn nào.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow p-4"
          >
            {product.imageUrl && (
              <img src={product.imageUrl} alt={product.name} className="w-full h-40 object-cover rounded-lg mb-3" />
            )}
            <h3 className="font-semibold text-lg text-gray-800">{product.name}</h3>
            {product.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
            )}
            <p className="text-blue-600 font-bold mt-2">{formatPrice(product.basePriceAmount)}</p>
            {product.modifierGroups.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">+ {product.modifierGroups.length} tùy chọn</p>
            )}
            <button
              onClick={() => openCustomize(product)}
              className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Thêm vào giỏ
            </button>
          </div>
        ))}
      </div>

      {/* Customization Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-1">{selectedProduct.name}</h2>
            <p className="text-blue-600 font-semibold mb-4">{formatPrice(selectedProduct.basePriceAmount)}</p>

            {error && (
              <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg mb-4 text-sm">{error}</div>
            )}

            {selectedProduct.modifierGroups.map((group) => (
              <div key={group.groupId} className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  {group.name}
                  {group.minSelected > 0 && (
                    <span className="text-red-500 text-xs ml-1">*Bắt buộc</span>
                  )}
                  <span className="text-xs text-gray-400 ml-1">
                    (Chọn {group.minSelected}-{group.maxSelected})
                  </span>
                </h4>
                <div className="space-y-1">
                  {group.modifiers.filter((m) => m.isActive).map((mod) => {
                    const isSelected = (selectedModifiers[group.groupId] || []).includes(mod.modifierId);
                    return (
                      <label
                        key={mod.modifierId}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleModifier(group.groupId, mod.modifierId, group.maxSelected)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm">{mod.name}</span>
                        </div>
                        {mod.priceAmount > 0 && (
                          <span className="text-sm text-gray-500">+{formatPrice(mod.priceAmount)}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3 mt-4 mb-4">
              <label className="text-sm font-medium text-gray-700">Số lượng:</label>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-4 py-1 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(99, quantity + 1))}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="text-lg font-bold text-gray-800 mb-4">
              Tổng: {formatPrice(calculateItemPrice())}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedProduct(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleAddToCart}
                disabled={addMutation.isPending}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
              >
                {addMutation.isPending ? 'Đang thêm...' : 'Thêm vào giỏ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}