import styles from './loading-state.module.scss';

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = 'Carregando…' }: LoadingStateProps) {
  return (
    <div className={styles['loading-state']} role="status" aria-live="polite">
      <span className={styles['loading-state__spinner']} aria-hidden="true" />
      <span className={styles['loading-state__label']}>{label}</span>
    </div>
  );
}
