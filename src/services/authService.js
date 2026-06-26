import { apiClient } from '@/api/apiClient';

export const authService = {
  register: (data) => apiClient.auth.register(data),
  login: (email, password) => apiClient.auth.login(email, password),
  logout: (redirectTo) => apiClient.auth.logout(redirectTo),
  me: () => apiClient.auth.me(),
  updateMe: (data) => apiClient.auth.updateMe(data),
  isAuthenticated: () => apiClient.auth.isAuthenticated(),
  requestPasswordReset: (email) => apiClient.auth.requestPasswordReset(email),
  resetPassword: (token, newPassword) => apiClient.auth.resetPassword(token, newPassword)
};
