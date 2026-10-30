import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';

import LoginScreen from '@/auth/login-screen';
import { AppLayout, RouteError } from '@/components/layout';

import { guardianProfileLoader, homeLoader, patientRecordLoader, redirectIfAuthenticated, requireSession, tasksLoader } from './loaders';
import { ROUTES, type RouteHandle } from './paths';

/** Code-splits each page: its chunk is only downloaded the first time the route is visited. */
const lazyPage = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default });

const navSection = (section: RouteHandle['navSection']): RouteHandle => ({ navSection: section });

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to={ROUTES.home} replace /> },
  { path: ROUTES.login, element: <LoginScreen />, loader: redirectIfAuthenticated },
  {
    element: <AppLayout />,
    loader: requireSession,
    children: [
      {
        // Pathless route so page errors render inside the shell, keeping header and navbar
        errorElement: <RouteError />,
        children: [
          { path: ROUTES.home, loader: homeLoader, lazy: lazyPage(() => import('@/pages/home')), handle: navSection(ROUTES.home) },
          { path: ROUTES.search, lazy: lazyPage(() => import('@/pages/search')), handle: navSection(ROUTES.search) },
          { path: ROUTES.reader, lazy: lazyPage(() => import('@/pages/reader')), handle: navSection(ROUTES.reader) },
          { path: ROUTES.history, lazy: lazyPage(() => import('@/pages/history')), handle: navSection(ROUTES.history) },
          { path: ROUTES.tasks, loader: tasksLoader, lazy: lazyPage(() => import('@/pages/tasks')), handle: navSection(ROUTES.tasks) },
          {
            path: ROUTES.guardianProfile,
            loader: guardianProfileLoader,
            lazy: lazyPage(() => import('@/pages/guardian-profile')),
            handle: navSection(ROUTES.search),
          },
          {
            path: ROUTES.patientRecord,
            loader: patientRecordLoader,
            lazy: lazyPage(() => import('@/pages/patient-record')),
            handle: navSection(ROUTES.home),
          },
          { path: '*', lazy: lazyPage(() => import('@/pages/not-found')) },
        ],
      },
    ],
  },
]);
