import type { ReactNode } from 'react';
import { BadgeCheck, FolderOpen, Nfc } from 'lucide-react';

import { PawIcon } from '@/assets/icons/paw-icon';
import { Avatar } from '@/components/ui/avatar/Avatar';
import { Button } from '@/components/ui/button/Button';
import { TagInfo } from '@/components/ui/tag-info/TagInfo';

import styles from './pet-card.module.scss';

type PetCardProps = {
  /** Small label above the card content, e.g. "Tag detectada". */
  eyebrow?: ReactNode;
  name: string;
  description: string;
  photoUrl?: string;
  tagCode: string;
  isTagActive: boolean;
  /** Top-right slot, e.g. a status badge or the visit time. */
  aside?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export function PetCard({
  eyebrow,
  name,
  description,
  photoUrl,
  tagCode,
  isTagActive,
  aside,
  actionLabel = 'Abrir Prontuário Completo',
  onAction,
}: PetCardProps) {
  return (
    <article className={styles['pet-card']}>
      {eyebrow && <div className={styles['pet-card__eyebrow']}>{eyebrow}</div>}
      <div className={styles['pet-card__content']}>
        <Avatar
          src={photoUrl}
          alt={`Foto de ${name}`}
          size={74}
          shape="rounded"
          fallback={<PawIcon aria-hidden="true" />}
        />

        <div className={styles['pet-card__content__body']}>
          <header className={styles['pet-card__body__header']}>
            <h3 className={styles['pet-card__header__name']}>{name}</h3>
            {aside}
          </header>
          <p className={styles['pet-card__body__description']}>{description}</p>
          <TagInfo
            identifier={{ icon: Nfc, label: tagCode }}
            status={{
              icon: BadgeCheck,
              label: isTagActive ? 'Tag Ativa' : 'Tag Inativa',
              tone: isTagActive ? 'highlight' : 'muted',
            }}
          />
        </div>
      </div>

      <Button className={styles['pet-card__action']} onClick={onAction}>
        <FolderOpen aria-hidden="true" />
        <span>{actionLabel}</span>
      </Button>
    </article>
  );
}
