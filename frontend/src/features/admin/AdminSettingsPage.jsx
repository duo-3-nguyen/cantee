import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../shared/api/client.js';

const DAYS = [
  { value: 0, label: 'Chủ nhật' },
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' },
];

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings/canteen').then((r) => r.data.data.settings),
  });

  useEffect(() => {
    if (data && !form) {
      setForm({
        canteenName: data.canteenName,
        address: data.address,
        timezone: data.timezone,
        openingHours: DAYS.map((day) => {
          const existing = data.openingHours.find((d) => d.dayOfWeek === day.value);
          return existing || { dayOfWeek: day.value, isOpen: false, openTime: null, closeTime: null };
        }),
      });
    }
  }, [data, form]);

  const mutation = useMutation({
    mutationFn: (data) => api.put('/settings/canteen', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccess('Đã lưu cài đặt!');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => setError(err.response?.data?.error?.message || 'Lỗi lưu cài đặt'),
  });

  const handleSave = () => {
    setError('');
    setSuccess('');
    const payload = {
      ...form,
      openingHours: form.openingHours.map((d) => ({
        ...d,
        openTime: d.isOpen ? d.openTime : null,
        closeTime: d.isOpen ? d.closeTime : null,
      })),
    };
    mutation.mutate(payload);
  };

  if (isLoading || !form) {
    return <div className="text-center py-12 text-gray-500">Đang tải cài đặt...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Cài đặt canteen</h1>

      {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg mb-4 text-sm">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 px-3 py-2 rounded-lg mb-4 text-sm">{success}</div>}

      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên canteen</label>
            <input
              value={form.canteenName}
              onChange={(e) => setForm({ ...form, canteenName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Múi giờ</label>
            <select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
              <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
              <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Giờ mở cửa</label>
            <div className="space-y-2">
              {form.openingHours.map((day, index) => (
                <div key={day.dayOfWeek} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 w-24">
                    <input
                      type="checkbox"
                      checked={day.isOpen}
                      onChange={(e) => {
                        const hours = [...form.openingHours];
                        hours[index] = {
                          ...hours[index],
                          isOpen: e.target.checked,
                          openTime: e.target.checked ? '07:00' : null,
                          closeTime: e.target.checked ? '17:00' : null,
                        };
                        setForm({ ...form, openingHours: hours });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{DAYS[index].label}</span>
                  </label>
                  {day.isOpen && (
                    <>
                      <input
                        type="time"
                        value={day.openTime || '07:00'}
                        onChange={(e) => {
                          const hours = [...form.openingHours];
                          hours[index] = { ...hours[index], openTime: e.target.value };
                          setForm({ ...form, openingHours: hours });
                        }}
                        className="px-2 py-1 border rounded text-sm"
                      />
                      <span className="text-sm text-gray-500">đến</span>
                      <input
                        type="time"
                        value={day.closeTime || '17:00'}
                        onChange={(e) => {
                          const hours = [...form.openingHours];
                          hours[index] = { ...hours[index], closeTime: e.target.value };
                          setForm({ ...form, openingHours: hours });
                        }}
                        className="px-2 py-1 border rounded text-sm"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={mutation.isPending}
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {mutation.isPending ? 'Đang lưu...' : 'Lưu cài đặt'}
        </button>
      </div>
    </div>
  );
}