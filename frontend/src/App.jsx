import React, { Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import PageLoader from '@/components/shared/PageLoader';
import ScrollToTop from '@/components/ScrollToTop';
import AppRoutes from '@/routes/AppRoutes';

function RoutedApp() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <AppRoutes />
      </Suspense>
    </AppErrorBoundary>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <QueryClientProvider client={queryClientInstance}>
              <Router>
                <ScrollToTop />
                <RoutedApp />
              </Router>
              <Toaster />
            </QueryClientProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
