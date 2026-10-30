import clsx from 'clsx';
import { Link, useMatches } from 'react-router';

import type { RouteHandle } from '@/router/paths';

import { BOTTOM_NAVBAR_ITEMS, type BottomNavbarItem } from './bottom-navbar-items';
import styles from './bottom-navbar.module.scss';

type BottomNavbarProps = {
  items?: BottomNavbarItem[];
};

/** The highlighted item comes from the deepest route that declares `handle.navSection`. */
const useActiveNavSection = () =>
  useMatches()
    .map(({ handle }) => (handle as RouteHandle | undefined)?.navSection)
    .findLast(Boolean);

export function BottomNavbar({ items = BOTTOM_NAVBAR_ITEMS }: BottomNavbarProps) {
  const activeSection = useActiveNavSection();

  return (
    <nav className={styles['bottom-navbar']} aria-label="Navegação principal">
      <ul className={styles['bottom-navbar__list']}>
        {items.map((item) => {
          const isActive = item.to === activeSection;

          return (
            <li key={item.to}>
              <Link
                className={clsx(styles['bottom-navbar__list__link'], isActive && styles['bottom-navbar__list__link--active'])}
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className={styles['bottom-navbar__link__icon']} aria-hidden="true" />
                <span className={styles['bottom-navbar__link__label']}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
