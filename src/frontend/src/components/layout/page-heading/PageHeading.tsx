import styles from './page-heading.module.scss';

type PageHeadingProps = {
  title: string;
  subtitle?: string;
};

export function PageHeading({ title, subtitle }: PageHeadingProps) {
  return (
    <section className={styles['page-heading']}>
      <h1 className={styles['page-heading__title']}>{title}</h1>
      {subtitle && <p className={styles['page-heading__subtitle']}>{subtitle}</p>}
    </section>
  );
}
