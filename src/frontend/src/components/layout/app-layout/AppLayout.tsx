import { Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';

import { LoadingState } from '@/components/ui/loading-state/LoadingState';
import { useNfcPatientNavigation } from '@/hooks/useNfcPatientNavigation';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { ROUTES } from '@/router/paths';
import { useSessionStore } from '@/stores/useSessionStore';

import { BottomNavbar } from '../bottom-navbar/BottomNavbar';
import { Header } from '../header/Header';
import { OfflineBanner } from '../offline-banner/OfflineBanner';

import styles from './app-layout.module.scss';

/**
 * Shell shared by every authenticated screen. Header and navbar mount once;
 * only the <Outlet> swaps between pages, which are lazy-loaded behind the Suspense boundary.
 */
export function AppLayout() {
  const user = useSessionStore((state) => state.user);
  const location = useLocation();
  useNfcPatientNavigation();
  useOfflineSync(user?.id ?? null);

  // The router loader blocks unauthenticated entry; this covers a session that ends while the app is open (401, logout)
  if (!user) return <Navigate to={`${ROUTES.login}?redirectTo=${encodeURIComponent(location.pathname)}`} replace />;

  return (
    <div className={styles['app-layout']}>
      <Header user={user} />
      <main className={styles['app-layout__main']}>
        <OfflineBanner />
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNavbar />
    </div>
  );
}
