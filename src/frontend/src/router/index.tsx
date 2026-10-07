import type { ComponentType } from 'react';

import LoginScreen from '@/auth/login-screen';

export interface RouteDefinition {
  path: string;
  label: string;
  component: ComponentType;
}

export const AppRoutes: RouteDefinition[] = [
  {
    path: '/',
    label: 'Login',
    component: LoginScreen,
  },
  {
    path: '/login',
    label: 'Login',
    component: LoginScreen,
  },
];

export function resolveRoute(pathname: string): RouteDefinition {
  const normalizedPath = pathname === '' ? '/' : pathname;
  return AppRoutes.find((route) => route.path === normalizedPath) ?? AppRoutes[0];
}
