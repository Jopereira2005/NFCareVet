import { BedDouble, CloudCheck, CloudOff, Tag } from 'lucide-react';

import { StatCard, StatusPill } from '@/components/ui';
import { useNfcTagUsage, useTemporalSummary } from '@/hooks/queries/useDashboardQueries';

import styles from './shift-summary-card.module.scss';

const padCount = (value: number | undefined) => (value === undefined ? '–' : String(value).padStart(2, '0'));
const totalLabel = (value: number | undefined) => (value === undefined ? '…' : `${value} total`);

/** "Sistema Clínico" card: API status plus kennel occupancy and NFC tag usage. */
export function ShiftSummaryCard() {
  const summaryQuery = useTemporalSummary();
  const tagUsageQuery = useNfcTagUsage();
  // The card is fed by the API, so reaching it is what "online" means for the clinical system
  const isOffline = summaryQuery.isError;
  const StatusIcon = isOffline ? CloudOff : CloudCheck;

  return (
    <section className={styles['shift-summary-card']} aria-labelledby="shift-summary-title">
      <header className={styles['shift-summary-card__header']}>
        <div className={styles['shift-summary-card__header__title']}>
          <span className={styles['shift-summary-card__title__icon']}>
            <StatusIcon aria-hidden="true" />
          </span>
          <h2 id="shift-summary-title" className={styles['shift-summary-card__title__label']}>
            Sistema Clínico
          </h2>
        </div>
        <StatusPill label={isOffline ? 'Offline' : 'Online'} tone={isOffline ? 'danger' : 'success'} />
      </header>

      <div className={styles['shift-summary-card__stats']}>
        <StatCard
          label="Leitos Clínicos"
          icon={BedDouble}
          totalLabel={totalLabel(summaryQuery.data?.totalKennels)}
          caption="Ocupados"
          value={padCount(summaryQuery.data?.currentlyActive)}
          detail="Internados"
          tone="danger"
        />
        <StatCard
          label="Coleiras & Tags"
          icon={Tag}
          totalLabel={totalLabel(tagUsageQuery.data?.total)}
          caption="Em uso"
          value={padCount(tagUsageQuery.data?.linked)}
          detail="Vinculadas"
        />
      </div>
    </section>
  );
}
