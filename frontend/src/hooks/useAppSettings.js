import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';

export function useAppSettings(group) {
  const query = useQuery({
    queryKey: ['app-settings', group],
    queryFn: () => apiClient.entities.AppSetting.filter({ setting_group: group, is_active: true }, 'sort_order'),
    staleTime: 5 * 60_000
  });
  const dynamic = (query.data || []).map((item) => ({ value: item.value, label: item.label_bn || item.label_en || item.value }));
  return { ...query, options: dynamic };
}
