import { PATIENTS_MOCK } from './patients.mock';

export type MockCollarTag = {
  tagUid: string;
  publicCode: string;
  patientName?: string;
};

export type MockUserBadge = {
  badgeUid: string;
  userName: string;
  userId: string;
};

// Coleiras avulsas no inventário inicial
const mockExtraCollars: MockCollarTag[] = [
  { tagUid: '04A1B2C3D47701', publicCode: 'VET-7701' },
];

// Crachás da equipe médica e recepção inicial
const mockStaffBadges: MockUserBadge[] = [
  { badgeUid: 'BADGE001', userName: 'Dra. Camila Andrade (Admin)', userId: 'user-camila' },
  { badgeUid: 'BADGE002', userName: 'Dra. Madalena Silva', userId: 'user-madalena' },
  { badgeUid: 'BADGE004', userName: 'Dr. Marcos Paxe (Mr Paxe)', userId: 'user-paxe' },
  { badgeUid: 'BADGE005', userName: 'Dr. Rafael Mendes', userId: 'user-rafael' },
  { badgeUid: 'BADGE003', userName: 'Carlos Recepção', userId: 'user-carlos' },
  { badgeUid: 'BADGE006', userName: 'Fernanda Oliveira', userId: 'user-fernanda' },
];

export const getMockCollarTags = (): MockCollarTag[] => {
  const fromPatients: MockCollarTag[] = PATIENTS_MOCK.flatMap((p) =>
    p.nfcTag ? [{ tagUid: p.nfcTag.tagUid, publicCode: p.nfcTag.publicCode, patientName: p.name }] : [],
  );
  return [...mockExtraCollars, ...fromPatients];
};

export const findMockCollarByUid = (rawUid: string): MockCollarTag | undefined => {
  const sanitized = rawUid.replace(/[:\s-]/g, '').toUpperCase();
  return getMockCollarTags().find((t) => t.tagUid.replace(/[:\s-]/g, '').toUpperCase() === sanitized);
};

export const findMockUserBadgeByUid = (rawUid: string): MockUserBadge | undefined => {
  const sanitized = rawUid.replace(/[:\s-]/g, '').toUpperCase();
  return mockStaffBadges.find((b) => b.badgeUid.replace(/[:\s-]/g, '').toUpperCase() === sanitized);
};

export const addMockCollarTag = (collar: MockCollarTag) => {
  mockExtraCollars.unshift(collar);
};

export const setMockUserBadge = (userId: string, userName: string, badgeUid: string | null) => {
  const sanitized = badgeUid ? badgeUid.replace(/[:\s-]/g, '').toUpperCase() : null;
  const index = mockStaffBadges.findIndex((b) => b.userId === userId);
  if (!sanitized) {
    if (index >= 0) mockStaffBadges.splice(index, 1);
    return;
  }
  const item: MockUserBadge = { userId, userName, badgeUid: sanitized };
  if (index >= 0) {
    mockStaffBadges[index] = item;
  } else {
    mockStaffBadges.push(item);
  }
};
