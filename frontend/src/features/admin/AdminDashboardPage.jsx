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
    <div></div>
  );
}