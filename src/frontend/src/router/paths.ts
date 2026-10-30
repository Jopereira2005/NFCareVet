import { generatePath } from 'react-router';

/** Every route path in one place; links and the router read from here. */
export const ROUTES = {
  login: '/login',
  home: '/home',
  search: '/search',
  reader: '/reader',
  history: '/history',
  tasks: '/tasks',
  guardianProfile: '/guardians/:guardianId',
  patientRecord: '/patients/:patientId/record',
} as const;

/** Bottom navbar entry highlighted while a route is open (see `handle.navSection` in the router). */
export type NavSection = (typeof ROUTES)['home' | 'search' | 'reader' | 'history' | 'tasks'];

export interface RouteHandle {
  navSection?: NavSection;
}

export const getPatientRecordPath = (patientId: string) => generatePath(ROUTES.patientRecord, { patientId });

export const getGuardianProfilePath = (guardianId: string) => generatePath(ROUTES.guardianProfile, { guardianId });
