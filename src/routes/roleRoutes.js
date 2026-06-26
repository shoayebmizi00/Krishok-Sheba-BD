export function dashboardPathForRole(role) {
  if (role === 'admin') return '/admin';
  if (role === 'buyer') return '/buyer-dashboard';
  if (role === 'equipment_owner') return '/equipment-owner-dashboard';
  if (role === 'transport_provider') return '/transport-dashboard';
  return '/farmer-dashboard';
}
