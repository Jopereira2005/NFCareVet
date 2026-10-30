import clsx from 'clsx';
import { Check, Clock, Droplet, Ellipsis, UserRound } from 'lucide-react';

import type { IconComponent } from '@/interfaces/icon.types';
import type { TaskPriority } from '@/interfaces/prescription.types';

import styles from './task-card.module.scss';

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

type TaskCardProps = {
  title: string;
  description: string;
  time: string;
  location: string;
  assignee?: string;
  priority: TaskPriority;
  icon?: IconComponent;
  /** Opens the task's edit dialog (the "…" button). */
  onEdit?: () => void;
  /** Registers the task as done (the check button). */
  onAdminister?: () => void;
};

export function TaskCard({ title, description, time, location, assignee, priority, icon: Icon = Droplet, onEdit, onAdminister }: TaskCardProps) {
  return (
    <article className={clsx(styles['task-card'], styles[`task-card--${priority}`])}>
      <div className={styles['task-card__content']}>
        <div className={styles['task-card__content__heading']}>
          <span className={styles['task-card__heading__icon']}>
            <Icon aria-hidden="true" />
          </span>
          <div className={styles['task-card__heading__texts']}>
            <h3 className={styles['task-card__texts__title']}>{title}</h3>
            <p className={styles['task-card__texts__description']}>{description}</p>
          </div>
        </div>

        <p className={styles['task-card__content__meta']}>
          <span className={styles['task-card__meta__time']}>
            <Clock aria-hidden="true" />
            <time>{time}</time>
          </span>
          <span aria-hidden="true">•</span>
          <span>{location}</span>
          {assignee && (
            <>
              <span aria-hidden="true">•</span>
              <span className={styles['task-card__meta__assignee']}>
                <UserRound aria-hidden="true" />
                {assignee}
              </span>
            </>
          )}
        </p>
      </div>

      <div className={styles['task-card__side']}>
        <span className={styles['task-card__side__priority']}>
          <span aria-hidden="true">!</span>
          {PRIORITY_LABEL[priority]}
        </span>
        <div className={styles['task-card__side__actions']}>
          {onAdminister && (
            <button type="button" className={styles['task-card__actions__administer']} aria-label={`Administrar ${title}`} onClick={onAdminister}>
              <Check aria-hidden="true" />
            </button>
          )}
          <button type="button" className={styles['task-card__actions__menu']} aria-label={`Editar tarefa ${title}`} onClick={onEdit}>
            <Ellipsis aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
