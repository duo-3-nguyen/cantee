import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../shared/api/client.js';
import { formatPrice, getStatusColor, getStatusLabel } from '../../shared/utils/helpers.js';

const EMPTY_PRODUCT = {
  name: '',
  description: '',
  basePriceAmount: 0,
  imageUrl: null,
  status: 'available',
  modifierGroups: [],
};

export default function StaffProductsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditing(null);
    },
    onError: (err) => setError(err.response?.data?.error?.message || 'Lỗi'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditing(null);
    },
    onError: (err) => setError(err.response?.data?.error?.message || 'Lỗi'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/products/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const openCreate = () => {
    setForm({ ...EMPTY_PRODUCT });
    setEditing('new');
    setError('');
  };

  const openEdit = (product) => {
    setForm({
      name: product.name,
      description: product.description || '',
      basePriceAmount: product.basePriceAmount,
      imageUrl: product.imageUrl,
      status: product.status,
      modifierGroups: product.modifierGroups.map((g) => ({
        groupId: g.groupId,
        name: g.name,
        modifiers: g.modifiers.map((m) => ({
          modifierId: m.modifierId,
          name: m.name,
          priceAmount: m.priceAmount,
          isActive: m.isActive,
        })),
        defaultModifierIds: [...g.defaultModifierIds],
        minSelected: g.minSelected,
        maxSelected: g.maxSelected,
      })),
    });
    setEditing(product._id);
    setError('');
  };

  const addModifierGroup = () => {
    setForm({
      ...form,
      modifierGroups: [
        ...form.modifierGroups,
        {
          groupId: `group-${Date.now()}`,
          name: '',
          modifiers: [],
          defaultModifierIds: [],
          minSelected: 0,
          maxSelected: 1,
        },
      ],
    });
  };

  const updateModifierGroup = (index, field, value) => {
    const groups = [...form.modifierGroups];
    groups[index] = { ...groups[index], [field]: value };
    setForm({ ...form, modifierGroups: groups });
  };

  const removeModifierGroup = (index) => {
    setForm({ ...form, modifierGroups: form.modifierGroups.filter((_, i) => i !== index) });
  };

  const addModifier = (groupIndex) => {
    const groups = [...form.modifierGroups];
    groups[groupIndex].modifiers.push({
      modifierId: `mod-${Date.now()}`,
      name: '',
      priceAmount: 0,
      isActive: true,
    });
    setForm({ ...form, modifierGroups: groups });
  };

  const updateModifier = (groupIndex, modIndex, field, value) => {
    const groups = [...form.modifierGroups];
    groups[groupIndex].modifiers[modIndex] = {
      ...groups[groupIndex].modifiers[modIndex],
      [field]: value,
    };
    setForm({ ...form, modifierGroups: groups });
  };

  const removeModifier = (groupIndex, modIndex) => {
    const groups = [...form.modifierGroups];
    groups[groupIndex].modifiers.splice(modIndex, 1);
    setForm({ ...form, modifierGroups: groups });
  };

  const handleSave = () => {
    setError('');
    const payload = {
      ...form,
      basePriceAmount: parseInt(form.basePriceAmount, 10) || 0,
      modifierGroups: form.modifierGroups.map((g) => ({
        ...g,
        minSelected: parseInt(g.minSelected, 10) || 0,
        maxSelected: parseInt(g.maxSelected, 10) || 0,
        modifiers: g.modifiers.map((m) => ({
          ...m,
          priceAmount: parseInt(m.priceAmount, 10) || 0,
        })),
      })),
    };

    if (editing === 'new') {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: editing, data: payload });
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Đang tải sản phẩm...</div>;
  }

  const products = data || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📦 Quản lý sản phẩm</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
        >
          + Thêm sản phẩm
        </button>
      </div>

      <div className="space-y-3">
        {products.map((product) => (
          <div key={product._id} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-800">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.description}</p>
                <p className="text-blue-600 font-bold">{formatPrice(product.basePriceAmount)}</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(product.status)}`}>
                  {getStatusLabel(product.status)}
                </span>
              </div>
              <div className="flex gap-2">
                <select
                  value={product.status}
                  onChange={(e) => statusMutation.mutate({ id: product._id, status: e.target.value })}
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value="available">Có sẵn</option>
                  <option value="unavailable">Không có sẵn</option>
                  <option value="hidden">Ẩn</option>
                </select>
                <button
                  onClick={() => openEdit(product)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Sửa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editing === 'new' ? 'Thêm sản phẩm mới' : 'Sửa sản phẩm'}
            </h2>

            {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg mb-4 text-sm">{error}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VND)</label>
                  <input
                    type="number"
                    value={form.basePriceAmount}
                    onChange={(e) => setForm({ ...form, basePriceAmount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="available">Có sẵn</option>
                    <option value="unavailable">Không có sẵn</option>
                    <option value="hidden">Ẩn</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Nhóm tùy chọn</label>
                  <button onClick={addModifierGroup} className="text-blue-600 text-sm hover:underline">
                    + Thêm nhóm
                  </button>
                </div>
                {form.modifierGroups.map((group, gi) => (
                  <div key={gi} className="border rounded-lg p-3 mb-2">
                    <div className="flex gap-2 mb-2">
                      <input
                        value={group.name}
                        onChange={(e) => updateModifierGroup(gi, 'name', e.target.value)}
                        placeholder="Tên nhóm"
                        className="flex-1 px-2 py-1 border rounded text-sm"
                      />
                      <input
                        type="number"
                        value={group.minSelected}
                        onChange={(e) => updateModifierGroup(gi, 'minSelected', e.target.value)}
                        placeholder="Min"
                        className="w-16 px-2 py-1 border rounded text-sm"
                        min="0"
                      />
                      <input
                        type="number"
                        value={group.maxSelected}
                        onChange={(e) => updateModifierGroup(gi, 'maxSelected', e.target.value)}
                        placeholder="Max"
                        className="w-16 px-2 py-1 border rounded text-sm"
                        min="0"
                      />
                      <button onClick={() => removeModifierGroup(gi)} className="text-red-500 text-sm">✕</button>
                    </div>
                    <div className="space-y-1">
                      {group.modifiers.map((mod, mi) => (
                        <div key={mi} className="flex gap-2 items-center">
                          <input
                            value={mod.name}
                            onChange={(e) => updateModifier(gi, mi, 'name', e.target.value)}
                            placeholder="Tên lựa chọn"
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          />
                          <input
                            type="number"
                            value={mod.priceAmount}
                            onChange={(e) => updateModifier(gi, mi, 'priceAmount', e.target.value)}
                            placeholder="Giá"
                            className="w-24 px-2 py-1 border rounded text-sm"
                            min="0"
                          />
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={mod.isActive}
                              onChange={(e) => updateModifier(gi, mi, 'isActive', e.target.checked)}
                            />
                            Active
                          </label>
                          <button onClick={() => removeModifier(gi, mi)} className="text-red-500 text-sm">✕</button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => addModifier(gi)} className="text-blue-600 text-xs mt-1 hover:underline">
                      + Thêm lựa chọn
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium">
                Hủy
              </button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}