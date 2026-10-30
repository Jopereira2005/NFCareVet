import { History, House, ListChecks, Nfc, Search } from 'lucide-react';

import type { IconComponent } from '@/interfaces/icon.types';
import { ROUTES, type NavSection } from '@/router/paths';

export type BottomNavbarItem = {
  label: string;
  to: NavSection;
  icon: IconComponent;
};

export const BOTTOM_NAVBAR_ITEMS: BottomNavbarItem[] = [
  { label: 'Início', to: ROUTES.home, icon: House },
  { label: 'Busca', to: ROUTES.search, icon: Search },
  { label: 'Leitor', to: ROUTES.reader, icon: Nfc },
  { label: 'Histórico', to: ROUTES.history, icon: History },
  { label: 'Tarefas', to: ROUTES.tasks, icon: ListChecks },
];
