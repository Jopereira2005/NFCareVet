import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';

import { ToastViewport } from '@/components/layout';
import { router } from '@/router';
import { queryClient } from '@/services/query-client';

import './styles/main.scss';

// Devtools only exist in development builds; the import is dropped from production bundles
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() => import('@tanstack/react-query-devtools').then((module) => ({ default: module.ReactQueryDevtools })))
  : () => null;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ToastViewport />
      <Suspense>
        <ReactQueryDevtools buttonPosition="top-left" />
      </Suspense>
    </QueryClientProvider>
  </StrictMode>,
);
