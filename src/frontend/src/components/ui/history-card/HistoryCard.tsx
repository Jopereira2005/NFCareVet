import { useId, useState } from 'react';
import clsx from 'clsx';
import { Activity, ChevronDown, Clock, ClipboardList, PencilLine, UserRound } from 'lucide-react';

import { PawIcon } from '@/assets/icons/paw-icon';
import type { IconComponent } from '@/interfaces/icon.types';

import styles from './history-card.module.scss';

type HistoryCardProps = {
  title: string;
  time: string;
  professional: string;
  patientName?: string;
  details: string;
  prescribedBy?: string;
  performedBy: string;
  dateLabel: string;
  icon?: IconComponent;
  /** Shows an "Editar registro" action inside the expanded details. */
  onEdit?: () => void;
};

/** Collapsible record of a completed clinical activity. */
export function HistoryCard({
  title,
  time,
  professional,
  patientName,
  details,
  prescribedBy,
  performedBy,
  dateLabel,
  icon: Icon = Activity,
  onEdit,
}: HistoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const detailsId = useId();

  return (
    <article className={clsx(styles['history-card'], isExpanded && styles['history-card--expanded'])}>
      <button
        type="button"
        className={styles['history-card__summary']}
        aria-expanded={isExpanded}
        aria-controls={detailsId}
        onClick={() => setIsExpanded((expanded) => !expanded)}
      >
        <span className={styles['history-card__summary__icon']}>
          <Icon aria-hidden="true" />
        </span>

        <span className={styles['history-card__summary__texts']}>
          <span className={styles['history-card__texts__title']}>{title}</span>
          <span className={styles['history-card__texts__meta']}>
            {!isExpanded && (
              <>
                <span className={clsx(styles['history-card__meta__item'], styles['history-card__meta__item--mono'])}>
                  <Clock aria-hidden="true" />
                  {time}
                </span>
                <span aria-hidden="true">•</span>
              </>
            )}
            <span className={styles['history-card__meta__item']}>
              <UserRound aria-hidden="true" />
              {professional}
            </span>
            {patientName && (
              <>
                <span aria-hidden="true">•</span>
                <span className={styles['history-card__meta__item']}>
                  <PawIcon aria-hidden="true" />
                  {patientName}
                </span>
              </>
            )}
          </span>
        </span>

        <ChevronDown className={styles['history-card__summary__chevron']} aria-hidden="true" />
      </button>

      {isExpanded && (
        <div id={detailsId} className={styles['history-card__details']}>
          <p className={styles['history-card__details__content']}>{details}</p>
          <footer className={styles['history-card__details__footer']}>
            <span className={styles['history-card__footer__item']}>
              <ClipboardList aria-hidden="true" />
              {prescribedBy
                ? `Prescrito pelo(a) ${prescribedBy} e realizado pelo(a) ${performedBy}`
                : `Realizado pelo(a) ${performedBy}`}
            </span>
            <span className={clsx(styles['history-card__footer__item'], styles['history-card__footer__item--mono'])}>
              <Clock aria-hidden="true" />
              {dateLabel}
            </span>
          </footer>
          {onEdit && (
            <button type="button" className={styles['history-card__details__edit']} onClick={onEdit}>
              <PencilLine aria-hidden="true" />
              Editar registro
            </button>
          )}
        </div>
      )}
    </article>
  );
}
