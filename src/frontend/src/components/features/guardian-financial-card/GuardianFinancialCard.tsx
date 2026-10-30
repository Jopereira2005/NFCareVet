import clsx from 'clsx';
import { History, Wallet } from 'lucide-react';

import type { FinancialStatus } from '@/interfaces/guardian.types';

import styles from './guardian-financial-card.module.scss';

const STATUS_LABEL: Record<FinancialStatus, string> = {
  PAID: 'Quitado',
  PENDING: 'Pendente',
  OVERDUE: 'Em atraso',
};

type GuardianFinancialCardProps = {
  status: FinancialStatus;
  paymentMethod: string;
  onOpenHistory?: () => void;
};

export function GuardianFinancialCard({ status, paymentMethod, onOpenHistory }: GuardianFinancialCardProps) {
  return (
    <section className={styles['guardian-financial-card']} aria-label="Financeiro">
      <header className={styles['guardian-financial-card__header']}>
        <span className={styles['guardian-financial-card__header__title']}>
          <Wallet aria-hidden="true" />
          Financeiro
        </span>
        <span className={styles['guardian-financial-card__header__method']}>{paymentMethod}</span>
      </header>

      <div className={styles['guardian-financial-card__body']}>
        <span
          className={clsx(
            styles['guardian-financial-card__body__status'],
            styles[`guardian-financial-card__body__status--${status.toLowerCase()}`],
          )}
        >
          {STATUS_LABEL[status]}
        </span>
        <button
          type="button"
          className={styles['guardian-financial-card__body__history']}
          aria-label="Histórico financeiro"
          onClick={onOpenHistory}
        >
          <History aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
