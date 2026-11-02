import { useRef, useState, type FormEvent } from 'react';
import {
  Ban,
  BedDouble,
  CheckCircle2,
  Copy,
  ExternalLink,
  Link2,
  Link2Off,
  Nfc,
  Plus,
  Power,
  Radio,
  Search,
  Smartphone,
  Tag,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router';

import { PawIcon } from '@/assets/icons/paw-icon';
import { LinkTagModal } from '@/components/features';
import { PageHeading, SectionHeader } from '@/components/layout';
import {
  Badge,
  Button,
  IconButton,
  Input,
  Modal,
  QueryState,
  SegmentedControl,
  StatusPill,
  type SegmentedOption,
} from '@/components/ui';
import { useUnlinkTag } from '@/hooks/queries/useHospitalizationMutations';
import {
  useActivateNfcTag,
  useCreateNfcTag,
  useDeleteNfcTag,
  useInactivateNfcTag,
  useNfcTags,
} from '@/hooks/queries/useNfcTagQueries';
import { useNfcReader } from '@/hooks/useNfcReader';
import type { NfcReading, NfcTagInventoryItem } from '@/interfaces/nfc.types';
import { getBedsidePath, getPatientRecordPath } from '@/router/paths';
import { writeUrlToNfcTag } from '@/stores/useNfcStore';
import { showToast } from '@/stores/useToastStore';
import { normalizeText } from '@/utils/normalizeText';
import { pluralize } from '@/utils/pluralize';

import styles from './tags.module.scss';

type TagFilter = 'all' | 'available' | 'linked' | 'inactive';

const FILTER_OPTIONS: SegmentedOption<TagFilter>[] = [
  { value: 'all', label: 'Todas', icon: Tag },
  { value: 'available', label: 'Livres', icon: CheckCircle2 },
  { value: 'linked', label: 'Em Uso', icon: Link2 },
  { value: 'inactive', label: 'Inativas', icon: Ban },
];

const UID_HEX_PATTERN = /^[0-9A-F]{8,28}$/;

const generateSimulatedUid = () => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `04:A1:B2:C3:D4:${randomSuffix.slice(0, 2)}:${randomSuffix.slice(2, 4)}`;
};

const getTagBedsideUrl = (publicCode: string) =>
  `${window.location.origin}${getBedsidePath(publicCode)}`;

const matchesTagFilter = (tag: NfcTagInventoryItem, filter: TagFilter, query: string): boolean => {
  if (filter === 'available' && (!tag.active || Boolean(tag.occupant))) return false;
  if (filter === 'linked' && (!tag.active || !tag.occupant)) return false;
  if (filter === 'inactive' && tag.active) return false;

  const term = normalizeText(query);
  if (!term) return true;

  const searchable = [
    tag.publicCode,
    tag.tagUid,
    tag.occupant?.patientName ?? '',
    tag.occupant?.kennelName ?? '',
  ];

  return searchable.some((value) => normalizeText(value).includes(term));
};

type WriteUrlTarget = {
  publicCode: string;
  tagUid: string;
  url: string;
};

export default function Tags() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<TagFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [manualUid, setManualUid] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [tagUidToLink, setTagUidToLink] = useState<string | null>(null);
  const [writeTarget, setWriteTarget] = useState<WriteUrlTarget | null>(null);
  const [isWritingUrl, setIsWritingUrl] = useState(false);
  const writeAbortRef = useRef<AbortController | null>(null);

  const tagsQuery = useNfcTags();
  const createTag = useCreateNfcTag();
  const inactivateTag = useInactivateNfcTag();
  const activateTag = useActivateNfcTag();
  const deleteTag = useDeleteNfcTag();
  const unlinkTag = useUnlinkTag();

  const registerUid = (rawUid: string) => {
    const sanitized = rawUid.replace(/[:\s-]/g, '').toUpperCase();
    if (!UID_HEX_PATTERN.test(sanitized)) {
      setFormError('O UID deve conter entre 8 e 28 caracteres hexadecimais (0-9, A-F).');
      return;
    }

    setFormError(null);
    createTag.mutate(sanitized, {
      onSuccess: (createdTag) => {
        setManualUid('');
        setWriteTarget({
          publicCode: createdTag.publicCode,
          tagUid: createdTag.tagUid,
          url: getTagBedsideUrl(createdTag.publicCode),
        });
      },
    });
  };

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    registerUid(manualUid);
  };

  const handleNfcRead = ({ uid }: NfcReading) => {
    if (writeTarget) return;
    setManualUid(uid);
    setFormError(null);
    const existing = tagsQuery.data?.find((item) => item.tagUid === uid);
    if (existing) {
      showToast({
        tone: 'success',
        title: `Tag #${existing.publicCode} localizada`,
        description: `UID ${uid} já consta no inventário.`,
      });
      setSearchQuery(uid);
      return;
    }
    registerUid(uid);
  };

  const { status, isSupported, start, simulate } = useNfcReader({ onRead: handleNfcRead });

  const handleScanButton = () => {
    if (isSupported) {
      void start();
      return;
    }
    simulate(generateSimulatedUid());
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast({
        tone: 'success',
        title: 'URL copiada',
        description: url,
      });
    } catch {
      showToast({
        tone: 'warning',
        title: 'Não foi possível copiar automaticamente',
        description: url,
      });
    }
  };

  const closeWriteModal = () => {
    writeAbortRef.current?.abort();
    writeAbortRef.current = null;
    setIsWritingUrl(false);
    setWriteTarget(null);
  };

  const handleWriteUrlToTag = async () => {
    if (!writeTarget) return;
    const trimmedUrl = writeTarget.url.trim();
    if (!trimmedUrl) return;

    if (!isSupported) {
      setIsWritingUrl(true);
      window.setTimeout(() => {
        setIsWritingUrl(false);
        showToast({
          tone: 'success',
          title: 'Gravação NDEF simulada com sucesso',
          description: `URL gravada na tag #${writeTarget.publicCode}`,
        });
        setWriteTarget(null);
      }, 600);
      return;
    }

    writeAbortRef.current?.abort();
    const controller = new AbortController();
    writeAbortRef.current = controller;
    setIsWritingUrl(true);

    try {
      await writeUrlToNfcTag(trimmedUrl, controller.signal);
      showToast({
        tone: 'success',
        title: 'URL gravada na tag NFC!',
        description: `A coleira #${writeTarget.publicCode} agora abre o prontuário automaticamente ao aproximar o celular.`,
      });
      closeWriteModal();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setIsWritingUrl(false);
      showToast({
        tone: 'warning',
        title: 'Falha ao gravar URL na tag',
        description: error instanceof Error ? error.message : 'Aproxime a tag destravada novamente.',
      });
    }
  };

  const allTags = tagsQuery.data ?? [];
  const totalActive = allTags.filter((tag) => tag.active).length;
  const totalLinked = allTags.filter((tag) => tag.active && Boolean(tag.occupant)).length;
  const totalAvailable = allTags.filter((tag) => tag.active && !tag.occupant).length;
  const totalInactive = allTags.filter((tag) => !tag.active).length;

  return (
    <>
      <PageHeading
        title="Gestão de Tags NFC"
        subtitle="Provisionamento de coleiras inteligentes, gravação de URL NDEF e vínculos ativos"
      />

      <div className={styles['tags']}>
        <section className={styles['tags__summary']} aria-label="Resumo do inventário de tags">
          <div className={styles['tags__summary__card']}>
            <span className={styles['tags__summary__label']}>Ativas</span>
            <strong className={styles['tags__summary__value']}>{totalActive}</strong>
          </div>
          <div className={styles['tags__summary__card']}>
            <span className={styles['tags__summary__label']}>Livres</span>
            <strong className={styles['tags__summary__value']} data-tone="success">
              {totalAvailable}
            </strong>
          </div>
          <div className={styles['tags__summary__card']}>
            <span className={styles['tags__summary__label']}>Em Uso</span>
            <strong className={styles['tags__summary__value']} data-tone="info">
              {totalLinked}
            </strong>
          </div>
          <div className={styles['tags__summary__card']}>
            <span className={styles['tags__summary__label']}>Inativas</span>
            <strong className={styles['tags__summary__value']} data-tone="muted">
              {totalInactive}
            </strong>
          </div>
        </section>

        <section className={styles['tags__register']} aria-labelledby="tags-register-title">
          <SectionHeader titleId="tags-register-title" title="Cadastrar Nova Coleira / Tag" size="sm" />
          <form className={styles['tags__register__form']} onSubmit={handleManualSubmit} noValidate>
            <Input
              id="new-tag-uid"
              label="UID Físico da Tag (Hexadecimal)"
              placeholder="Ex: 04:A1:B2:C3:D4:E5:F6"
              value={manualUid}
              onChange={(event) => {
                setManualUid(event.target.value);
                if (formError) setFormError(null);
              }}
              leadingIcon={<Nfc />}
            />

            {formError && (
              <p className={styles['tags__register__error']} role="alert">
                {formError}
              </p>
            )}

            <div className={styles['tags__register__actions']}>
              <Button
                type="button"
                variant="outlined"
                onClick={handleScanButton}
                disabled={createTag.isPending}
              >
                <Nfc aria-hidden="true" />
                <span>{status === 'scanning' ? 'Aproxime a tag…' : isSupported ? 'Ler Tag NFC' : 'Simular Leitura'}</span>
              </Button>
              <Button type="submit" disabled={createTag.isPending || !manualUid.trim()}>
                <Plus aria-hidden="true" />
                <span>{createTag.isPending ? 'Cadastrando…' : 'Cadastrar Tag'}</span>
              </Button>
            </div>
          </form>
        </section>

        <section className={styles['tags__inventory']} aria-labelledby="tags-inventory-title">
          <SegmentedControl label="Filtrar inventário de tags" options={FILTER_OPTIONS} value={filter} onChange={setFilter} />

          <Input
            id="search-tags"
            label="Buscar tag por código, UID, paciente ou baia"
            placeholder="Filtrar por código (#tag-...), UID, paciente ou leito"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            leadingIcon={<Search />}
          />

          <QueryState query={tagsQuery} loadingLabel="Carregando inventário de tags…">
            {(tags) => {
              const filtered = tags.filter((tag) => matchesTagFilter(tag, filter, searchQuery));

              return (
                <>
                  <SectionHeader
                    titleId="tags-inventory-title"
                    title="Inventário de Coleiras"
                    size="lg"
                    aside={<Badge label={pluralize(filtered.length, 'tag', 'tags')} tone="dark" mono />}
                  />

                  {filtered.length === 0 ? (
                    <p className={styles['tags__empty']}>
                      Nenhuma tag encontrada para o filtro selecionado. Use o leitor acima para registrar uma nova coleira.
                    </p>
                  ) : (
                    <div className={styles['tags__list']}>
                      {filtered.map((tag) => {
                        const isLinked = Boolean(tag.occupant);
                        const statusLabel = !tag.active ? 'Inativa' : isLinked ? 'Em Uso' : 'Disponível';
                        const statusTone = !tag.active ? 'neutral' : isLinked ? 'danger' : 'success';
                        const bedsideUrl = getTagBedsideUrl(tag.publicCode);

                        return (
                          <article key={tag.id} className={styles['tag-card']}>
                            <header className={styles['tag-card__header']}>
                              <div className={styles['tag-card__identity']}>
                                <span className={styles['tag-card__icon']}>
                                  <Tag aria-hidden="true" />
                                </span>
                                <div className={styles['tag-card__identity__text']}>
                                  <h3 className={styles['tag-card__code']}>#{tag.publicCode}</h3>
                                  <p className={styles['tag-card__uid']}>UID: {tag.tagUid}</p>
                                </div>
                              </div>

                              <div className={styles['tag-card__header__aside']}>
                                <StatusPill label={statusLabel} tone={statusTone} />
                                {tag.active && !tag.occupant && (
                                  <IconButton
                                    icon={Trash2}
                                    label={`Excluir tag #${tag.publicCode}`}
                                    disabled={deleteTag.isPending}
                                    onClick={() => deleteTag.mutate(tag.id)}
                                  />
                                )}
                              </div>
                            </header>

                            <ul className={styles['tag-card__details']}>
                              {tag.occupant ? (
                                <>
                                  <li>
                                    <PawIcon aria-hidden="true" />
                                    <span>
                                      Vinculada a <strong>{tag.occupant.patientName}</strong> ({tag.occupant.species})
                                    </span>
                                  </li>
                                  <li>
                                    <BedDouble aria-hidden="true" />
                                    <span>{tag.occupant.kennelName}</span>
                                  </li>
                                </>
                              ) : (
                                <li>
                                  <Nfc aria-hidden="true" />
                                  <span>
                                    {tag.active
                                      ? 'Coleira livre e pronta para vínculo em admissão ou prontuário.'
                                      : 'Tag inativada no inventário.'}
                                  </span>
                                </li>
                              )}

                              <li className={styles['tag-card__details__url-row']}>
                                <div className={styles['tag-card__details__url']}>
                                  <Radio aria-hidden="true" />
                                  <span title={bedsideUrl}>{bedsideUrl}</span>
                                </div>
                                <div className={styles['tag-card__details__url-actions']}>
                                  <IconButton
                                    icon={Copy}
                                    label="Copiar URL da tag"
                                    onClick={() => void handleCopyUrl(bedsideUrl)}
                                  />
                                  <IconButton
                                    icon={Smartphone}
                                    label="Gravar URL no chip NFC (NDEF)"
                                    onClick={() =>
                                      setWriteTarget({
                                        publicCode: tag.publicCode,
                                        tagUid: tag.tagUid,
                                        url: bedsideUrl,
                                      })
                                    }
                                  />
                                </div>
                              </li>
                            </ul>

                            <div className={styles['tag-card__actions']}>
                              {tag.occupant ? (
                                <>
                                  <Button
                                    variant="outlined"
                                    onClick={() => navigate(getPatientRecordPath(tag.occupant!.patientId))}
                                  >
                                    <ExternalLink aria-hidden="true" />
                                    <span>Ver prontuário</span>
                                  </Button>
                                  <Button
                                    variant="danger"
                                    disabled={unlinkTag.isPending}
                                    onClick={() =>
                                      unlinkTag.mutate({
                                        hospitalizationId: tag.occupant!.hospitalizationId,
                                        payload: { reason: 'Liberada pela tela de Gestão de Tags' },
                                      })
                                    }
                                  >
                                    <Link2Off aria-hidden="true" />
                                    <span>Liberar tag</span>
                                  </Button>
                                </>
                              ) : tag.active ? (
                                <>
                                  <Button
                                    variant="outlined"
                                    disabled={inactivateTag.isPending}
                                    onClick={() => inactivateTag.mutate(tag.id)}
                                  >
                                    <Ban aria-hidden="true" />
                                    <span>Inativar</span>
                                  </Button>
                                  <Button variant="primary" onClick={() => setTagUidToLink(tag.tagUid)}>
                                    <Link2 aria-hidden="true" />
                                    <span>Vincular paciente</span>
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="outlined"
                                    disabled={activateTag.isPending}
                                    onClick={() => activateTag.mutate(tag.id)}
                                  >
                                    <Power aria-hidden="true" />
                                    <span>Reativar</span>
                                  </Button>
                                  <Button
                                    variant="danger"
                                    disabled={deleteTag.isPending}
                                    onClick={() => deleteTag.mutate(tag.id)}
                                  >
                                    <Trash2 aria-hidden="true" />
                                    <span>Excluir</span>
                                  </Button>
                                </>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            }}
          </QueryState>
        </section>
      </div>

      {tagUidToLink && <LinkTagModal tagUid={tagUidToLink} onClose={() => setTagUidToLink(null)} />}

      {writeTarget && (
        <Modal
          title="Gravar URL na Tag NFC (NDEF)"
          description={`Grave o endereço na memória NDEF da coleira #${writeTarget.publicCode} (UID ${writeTarget.tagUid}) para abertura automática ao aproximar o celular.`}
          onClose={closeWriteModal}
          footer={
            <>
              <Button variant="outlined" onClick={closeWriteModal}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => void handleWriteUrlToTag()}
                disabled={isWritingUrl || !writeTarget.url.trim()}
              >
                <Smartphone aria-hidden="true" />
                <span>
                  {isWritingUrl
                    ? 'Aproxime a tag…'
                    : isSupported
                      ? 'Gravar URL'
                      : 'Simular Gravação'}
                </span>
              </Button>
            </>
          }
        >
          <div className={styles['write-modal']}>
            <Input
              id="ndef-target-url"
              label="URL de destino (Registro NDEF)"
              value={writeTarget.url}
              onChange={(event) => setWriteTarget({ ...writeTarget, url: event.target.value })}
              leadingIcon={<Radio />}
            />
            <p className={styles['write-modal__hint']}>
              {isWritingUrl
                ? 'Encoste a traseira do celular na tag física NFC e mantenha parada até confirmar a gravação.'
                : 'Com essa URL gravada no chip NDEF, encostar qualquer smartphone na coleira abrirá direto o prontuário do paciente vinculado a esta tag.'}
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
