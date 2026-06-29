import React, { Suspense } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import PageLoader from '@/components/shared/PageLoader';
import RouteDiagnostics from '@/components/RouteDiagnostics';
import ScrollToTop from '@/components/ScrollToTop';
import AppRoutes from '@/routes/AppRoutes';

function RoutedApp() {
  const location = useLocation();

  return (
    <AppErrorBoundary key={location.pathname}>
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
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <ScrollToTop />
              <RouteDiagnostics />
              <RoutedApp />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
