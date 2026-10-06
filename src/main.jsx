import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './i18n';
import './styles/index.css';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './ui/Toast';
import ErrorBoundary from './ui/ErrorBoundary';
import { migrateLegacyKeys } from './lib/session';
import { initMonitoring } from './lib/monitoring';
import { initInstall } from './lib/install';
import { EVENTS, installAnalyticsFlush, track } from './lib/analytics';

migrateLegacyKeys();
initInstall();
initMonitoring();
installAnalyticsFlush();
track(EVENTS.APP_OPEN);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => {
        if (error?.status && error.status >= 400 && error.status < 500 && error.status !== 429) return false;
        return count < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
    mutations: { retry: 0 },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
