import { useState, type FormEvent } from 'react';
import type { IUser } from '@nfcarevet/common';
import { UserRole } from '@nfcarevet/common';
import {
  Calendar,
  CheckCircle2,
  KeyRound,
  Nfc,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  UserPlus,
  Users as UsersIcon,
  UserX,
} from 'lucide-react';

import { PageHeading, SectionHeader } from '@/components/layout';
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Input,
  Modal,
  QueryState,
  SegmentedControl,
  Select,
  StatusPill,
  type BadgeTone,
  type SegmentedOption,
  type SelectOption,
} from '@/components/ui';
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from '@/hooks/queries/useUserQueries';
import { useNfcReader } from '@/hooks/useNfcReader';
import type { NfcReading } from '@/interfaces/nfc.types';
import { findMockCollarByUid } from '@/mocks/nfc-registry.mock';
import { useSessionStore } from '@/stores/useSessionStore';
import { showToast } from '@/stores/useToastStore';
import { normalizeText } from '@/utils/normalizeText';
import { pluralize } from '@/utils/pluralize';

import styles from './users.module.scss';

type UserFilter = 'all' | 'vet' | 'rec' | 'admin' | 'inactive';

const FILTER_OPTIONS: SegmentedOption<UserFilter>[] = [
  { value: 'all', label: 'Todos', icon: UsersIcon },
  { value: 'vet', label: 'Veterinários', icon: Stethoscope },
  { value: 'rec', label: 'Recepção', icon: UserCheck },
  { value: 'admin', label: 'Admins', icon: ShieldCheck },
  { value: 'inactive', label: 'Inativos', icon: UserX },
];

const ROLE_OPTIONS: SelectOption[] = [
  { value: UserRole.VET, label: 'Veterinário(a)' },
  { value: UserRole.REC, label: 'Recepção / Atendimento' },
  { value: UserRole.ADMIN, label: 'Administrador(a)' },
];

const ROLE_LABELS: Record<UserRole, { label: string; tone: BadgeTone }> = {
  [UserRole.ADMIN]: { label: 'Administrador', tone: 'dark' },
  [UserRole.VET]: { label: 'Veterinário', tone: 'quaternary' },
  [UserRole.REC]: { label: 'Recepção', tone: 'neutral' },
};

const UID_PATTERN = /^[0-9A-Z]{4,32}$/;

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const generateSimulatedBadgeUid = () => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `04:E2:88:${randomSuffix.slice(0, 2)}:${randomSuffix.slice(2, 4)}`;
};

const matchesUserFilter = (user: IUser, filter: UserFilter, query: string): boolean => {
  if (filter === 'vet' && (user.role !== UserRole.VET || !user.active)) return false;
  if (filter === 'rec' && (user.role !== UserRole.REC || !user.active)) return false;
  if (filter === 'admin' && (user.role !== UserRole.ADMIN || !user.active)) return false;
  if (filter === 'inactive' && user.active) return false;

  const term = normalizeText(query);
  if (!term) return true;

  const searchable = [
    user.name,
    user.email,
    user.badgeUid ?? '',
    ROLE_LABELS[user.role]?.label ?? '',
  ];

  return searchable.some((value) => normalizeText(value).includes(term));
};

export default function Users() {
  const [filter, setFilter] = useState<UserFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<IUser | 'new' | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<IUser | null>(null);
  const [reactivatingUser, setReactivatingUser] = useState<IUser | null>(null);

  const currentUser = useSessionStore((state) => state.user);
  const usersQuery = useUsers();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const allUsers = usersQuery.data ?? [];
  const totalUsers = allUsers.length;
  const totalVets = allUsers.filter((u) => u.active && u.role === UserRole.VET).length;
  const totalRec = allUsers.filter((u) => u.active && u.role === UserRole.REC).length;
  const totalBadges = allUsers.filter((u) => u.active && Boolean(u.badgeUid)).length;

  return (
    <>
      <PageHeading
        title="Equipe & Colaboradores"
        subtitle="Gestão de profissionais, perfis de permissão e crachás NFC para login por aproximação"
      />

      <div className={styles['users']}>
        <section className={styles['users__summary']} aria-label="Resumo da equipe">
          <div className={styles['users__summary__card']}>
            <span className={styles['users__summary__label']}>Total Equipe</span>
            <strong className={styles['users__summary__value']}>{totalUsers}</strong>
          </div>
          <div className={styles['users__summary__card']}>
            <span className={styles['users__summary__label']}>Veterinários</span>
            <strong className={styles['users__summary__value']} data-tone="info">
              {totalVets}
            </strong>
          </div>
          <div className={styles['users__summary__card']}>
            <span className={styles['users__summary__label']}>Recepção</span>
            <strong className={styles['users__summary__value']} data-tone="success">
              {totalRec}
            </strong>
          </div>
          <div className={styles['users__summary__card']}>
            <span className={styles['users__summary__label']}>Crachás NFC</span>
            <strong className={styles['users__summary__value']}>{totalBadges}</strong>
          </div>
        </section>

        <section className={styles['users__inventory']} aria-labelledby="users-list-title">
          <div className={styles['users__action-bar']}>
            <Button onClick={() => setEditingUser('new')}>
              <UserPlus aria-hidden="true" />
              <span>Novo Colaborador</span>
            </Button>
          </div>

          <SegmentedControl
            label="Filtrar colaboradores por função ou status"
            options={FILTER_OPTIONS}
            value={filter}
            onChange={setFilter}
          />

          <Input
            id="search-users"
            label="Buscar por nome, e-mail ou UID do crachá"
            placeholder="Filtrar por nome, e-mail institucional ou UID do crachá"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            leadingIcon={<Search />}
          />

          <QueryState query={usersQuery} loadingLabel="Carregando colaboradores…">
            {(users) => {
              const filtered = users.filter((u) => matchesUserFilter(u, filter, searchQuery));

              return (
                <>
                  <SectionHeader
                    titleId="users-list-title"
                    title="Quadro de Colaboradores"
                    size="lg"
                    aside={
                      <Badge
                        label={pluralize(filtered.length, 'membro', 'membros')}
                        tone="dark"
                        mono
                      />
                    }
                  />

                  {filtered.length === 0 ? (
                    <p className={styles['users__empty']}>
                      Nenhum colaborador encontrado para o filtro selecionado.
                    </p>
                  ) : (
                    <div className={styles['users__list']}>
                      {filtered.map((u) => {
                        const isSelf = u.id === currentUser?.id;
                        const roleMeta = ROLE_LABELS[u.role] ?? {
                          label: u.role,
                          tone: 'neutral' as BadgeTone,
                        };

                        return (
                          <article
                            key={u.id}
                            className={`${styles['user-card']} ${
                              !u.active ? styles['user-card--inactive'] : ''
                            }`}
                          >
                            <header className={styles['user-card__header']}>
                              <div className={styles['user-card__identity']}>
                                <Avatar
                                  alt={u.name}
                                  size={40}
                                  src={u.avatarUrl ?? undefined}
                                  fallback={getInitials(u.name)}
                                />
                                <div className={styles['user-card__identity__text']}>
                                  <h3 className={styles['user-card__name']} title={u.name}>
                                    {u.name} {isSelf && '(Você)'}
                                  </h3>
                                  <p className={styles['user-card__email']} title={u.email}>
                                    {u.email}
                                  </p>
                                </div>
                              </div>

                              <div className={styles['user-card__header__aside']}>
                                <Badge label={roleMeta.label} tone={roleMeta.tone} />
                                <StatusPill
                                  label={u.active ? 'Ativo' : 'Inativo'}
                                  tone={u.active ? 'success' : 'neutral'}
                                />
                              </div>
                            </header>

                            <ul className={styles['user-card__details']}>
                              <li>
                                <Nfc aria-hidden="true" />
                                {u.badgeUid ? (
                                  <span>
                                    Crachá NFC: <code className={styles['user-card__badge-code']}>{u.badgeUid}</code>
                                  </span>
                                ) : (
                                  <span>Sem crachá vinculado (acesso por e-mail e senha)</span>
                                )}
                              </li>
                              <li>
                                <Calendar aria-hidden="true" />
                                <span>
                                  Cadastrado em {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                              </li>
                            </ul>

                            <div className={styles['user-card__actions']}>
                              <Button
                                variant="outlined"
                                onClick={() => setEditingUser(u)}
                              >
                                <Pencil aria-hidden="true" />
                                <span>Editar</span>
                              </Button>

                              {u.active ? (
                                <Button
                                  variant="outlined"
                                  disabled={isSelf || deleteUser.isPending}
                                  title={isSelf ? 'Você não pode inativar seu próprio usuário' : undefined}
                                  onClick={() => setDeactivatingUser(u)}
                                >
                                  <UserX aria-hidden="true" />
                                  <span>Inativar</span>
                                </Button>
                              ) : (
                                <Button
                                  variant="outlined"
                                  disabled={updateUser.isPending}
                                  onClick={() => setReactivatingUser(u)}
                                >
                                  <Power aria-hidden="true" />
                                  <span>Reativar</span>
                                </Button>
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

      {editingUser !== null && (
        <UserFormModal
          user={editingUser === 'new' ? null : editingUser}
          allUsers={allUsers}
          onClose={() => setEditingUser(null)}
        />
      )}

      {deactivatingUser !== null && (
        <DeactivateConfirmModal
          user={deactivatingUser}
          isPending={deleteUser.isPending}
          onClose={() => setDeactivatingUser(null)}
          onConfirm={() => {
            deleteUser.mutate(deactivatingUser.id, {
              onSuccess: () => setDeactivatingUser(null),
            });
          }}
        />
      )}

      {reactivatingUser !== null && (
        <ReactivateConfirmModal
          user={reactivatingUser}
          isPending={updateUser.isPending}
          onClose={() => setReactivatingUser(null)}
          onConfirm={() => {
            updateUser.mutate(
              {
                id: reactivatingUser.id,
                payload: { active: true },
              },
              {
                onSuccess: () => setReactivatingUser(null),
              },
            );
          }}
        />
      )}
    </>
  );
}

type UserFormModalProps = {
  user: IUser | null;
  allUsers: IUser[];
  onClose: () => void;
};

function UserFormModal({ user, allUsers, onClose }: UserFormModalProps) {
  const isEditing = Boolean(user);
  const isInitiallyInactive = Boolean(user && !user.active);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState<UserRole>(user?.role ?? UserRole.VET);
  const [password, setPassword] = useState('');
  const [badgeUid, setBadgeUid] = useState(user?.badgeUid ?? '');
  const [active, setActive] = useState(user ? user.active : true);
  const [formError, setFormError] = useState<string | null>(null);

  const validateBadgeConflict = (rawUid: string): string | null => {
    const sanitized = rawUid.replace(/[:\s-]/g, '').toUpperCase();
    if (!sanitized) return null;

    const conflictUser = allUsers.find(
      (u) =>
        u.id !== user?.id &&
        u.badgeUid &&
        u.badgeUid.replace(/[:\s-]/g, '').toUpperCase() === sanitized,
    );
    if (conflictUser) {
      return `O crachá [${sanitized}] já pertence ao colaborador "${conflictUser.name}".`;
    }

    const collar = findMockCollarByUid(sanitized);
    if (collar) {
      return collar.patientName
        ? `A tag [${sanitized}] pertence à coleira do paciente "${collar.patientName}" e não pode ser vinculada como crachá.`
        : `A tag [${sanitized}] já está cadastrada como coleira no inventário (#${collar.publicCode}).`;
    }

    return null;
  };

  const { status, isSupported, start, simulate } = useNfcReader({
    onRead: ({ uid }: NfcReading) => {
      setBadgeUid(uid);
      const conflict = validateBadgeConflict(uid);
      if (conflict) {
        setFormError(conflict);
        showToast({
          tone: 'warning',
          title: 'Crachá já cadastrado',
          description: conflict,
        });
        return;
      }

      setFormError(null);
      showToast({
        tone: 'success',
        title: 'Crachá NFC lido!',
        description: `UID ${uid} vinculado ao formulário.`,
      });
    },
  });

  const handleScanClick = () => {
    if (isSupported) {
      void start();
      return;
    }
    const simulated = generateSimulatedBadgeUid();
    simulate(simulated);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setFormError('O nome do colaborador é obrigatório.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setFormError('Informe um e-mail institucional válido.');
      return;
    }

    if (!isEditing && (!password || password.length < 6)) {
      setFormError('A senha inicial deve ter no mínimo 6 caracteres.');
      return;
    }

    if (isEditing && password && password.length < 6) {
      setFormError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    const sanitizedBadge = badgeUid.trim()
      ? badgeUid.replace(/[:\s-]/g, '').toUpperCase()
      : '';

    if (sanitizedBadge && !UID_PATTERN.test(sanitizedBadge)) {
      setFormError('O UID do crachá deve conter entre 4 e 32 caracteres alfanuméricos.');
      return;
    }

    if (sanitizedBadge) {
      const conflict = validateBadgeConflict(sanitizedBadge);
      if (conflict) {
        setFormError(conflict);
        showToast({
          tone: 'warning',
          title: conflict.toLowerCase().includes('coleira')
            ? 'Tag de coleira detectada'
            : 'Crachá já cadastrado',
          description: conflict,
        });
        return;
      }
    }

    setFormError(null);

    if (isEditing && user) {
      updateUser.mutate(
        {
          id: user.id,
          payload: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            role,
            ...(password ? { password } : {}),
            badgeUid: sanitizedBadge || '',
            active,
          },
        },
        {
          onSuccess: () => onClose(),
          onError: (error) => {
            setFormError(error.message);
            showToast({
              tone: 'warning',
              title: error.message.toLowerCase().includes('coleira')
                ? 'Tag de coleira detectada'
                : 'Crachá já cadastrado',
              description: error.message,
            });
          },
        },
      );
    } else {
      createUser.mutate(
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          password,
          badgeUid: sanitizedBadge || undefined,
          active,
        },
        {
          onSuccess: () => onClose(),
          onError: (error) => {
            setFormError(error.message);
            showToast({
              tone: 'warning',
              title: error.message.toLowerCase().includes('coleira')
                ? 'Tag de coleira detectada'
                : 'Crachá já cadastrado',
              description: error.message,
            });
          },
        },
      );
    }
  };

  const isSaving = createUser.isPending || updateUser.isPending;

  return (
    <Modal
      title={
        isEditing
          ? isInitiallyInactive
            ? active
              ? 'Editar Colaborador (Reativação Pendente)'
              : 'Editar Colaborador (Inativo)'
            : 'Editar Colaborador'
          : 'Novo Colaborador'
      }
      description={
        isEditing
          ? isInitiallyInactive
            ? `Perfil atualmente inativo. Atualize os dados cadastrais ou reative o acesso de ${user?.name}.`
            : `Atualize dados e crachá de ${user?.name}.`
          : 'Cadastre um novo membro da equipe com perfil de acesso e crachá NFC.'
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" form="user-modal-form" disabled={isSaving}>
            <Plus aria-hidden="true" />
            <span>
              {isSaving
                ? 'Salvando…'
                : isInitiallyInactive && active
                ? 'Reativar e Salvar'
                : isEditing
                ? 'Salvar Alterações'
                : 'Cadastrar'}
            </span>
          </Button>
        </>
      }
    >
      <form id="user-modal-form" className={styles['user-modal-form']} onSubmit={handleSubmit} noValidate>
        {isInitiallyInactive && (
          !active ? (
            <div className={styles['user-modal-form__inactive-banner']} role="alert">
              <UserX aria-hidden="true" />
              <div>
                <strong>Colaborador Inativo</strong>
                <p>
                  Este usuário está com o acesso ao sistema suspenso. Login por senha e crachá NFC estão bloqueados.
                </p>
              </div>
            </div>
          ) : (
            <div className={styles['user-modal-form__reactivate-banner']} role="status">
              <CheckCircle2 aria-hidden="true" />
              <div>
                <strong>Reativação Solicitada</strong>
                <p>
                  Ao salvar as alterações, a conta do colaborador será reativada e o acesso ao sistema restaurado.
                </p>
              </div>
            </div>
          )
        )}

        <Input
          id="user-name"
          label="Nome Completo"
          placeholder="Ex: Dra. Juliana Santos"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (formError) setFormError(null);
          }}
          required
        />

        <Input
          id="user-email"
          label="E-mail Institucional"
          type="email"
          placeholder="Ex: juliana.santos@nfcarevet.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (formError) setFormError(null);
          }}
          required
        />

        <Select
          id="user-role"
          label="Perfil de Permissões (Role)"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        />

        <Input
          id="user-password"
          label={isEditing ? 'Nova Senha (Opcional)' : 'Senha Inicial'}
          type="password"
          placeholder={isEditing ? 'Deixe vazio para manter a senha atual' : 'Mínimo de 6 caracteres'}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (formError) setFormError(null);
          }}
          leadingIcon={<KeyRound />}
          hint={isEditing ? 'Preencha apenas se desejar redefinir a senha do usuário.' : undefined}
          required={!isEditing}
        />

        <div className={styles['user-modal-form__nfc-box']}>
          <div className={styles['user-modal-form__nfc-header']}>
            <span className={styles['user-modal-form__nfc-label']}>Crachá NFC (Login por Aproximação)</span>
            <Button
              type="button"
              variant="outlined"
              onClick={handleScanClick}
              disabled={isSaving}
            >
              <Nfc aria-hidden="true" />
              <span>
                {status === 'scanning'
                  ? 'Aproxime o crachá…'
                  : isSupported
                  ? 'Ler Crachá NFC'
                  : 'Simular Crachá'}
              </span>
            </Button>
          </div>

          <Input
            id="user-badge-uid"
            label="UID do Crachá (Hexadecimal)"
            placeholder="Ex: 04:A1:B2:C3:D4:E5:F6"
            value={badgeUid}
            onChange={(e) => {
              setBadgeUid(e.target.value);
              if (formError) setFormError(null);
            }}
            hint="Aproxime o crachá NFC físico com Web NFC ativo ou digite manualmente."
            leadingIcon={<Nfc />}
            optional
          />
        </div>

        {isEditing && (
          <div className={styles['user-modal-form__status-field']}>
            <Checkbox
              id="user-active-toggle"
              label={
                isInitiallyInactive
                  ? 'Reativar conta (restaurar login e uso do crachá NFC)'
                  : 'Conta ativa (acesso liberado à plataforma)'
              }
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <p className={styles['user-modal-form__status-hint']}>
              {active
                ? 'O profissional poderá acessar a plataforma e utilizar o crachá NFC normalmente.'
                : 'O acesso à plataforma e a aproximação de crachá permanecem suspensos.'}
            </p>
          </div>
        )}

        {formError && (
          <p className={styles['user-modal-form__error']} role="alert">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}

type DeactivateConfirmModalProps = {
  user: IUser;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function DeactivateConfirmModal({
  user,
  isPending,
  onClose,
  onConfirm,
}: DeactivateConfirmModalProps) {
  return (
    <Modal
      title="Inativar Colaborador"
      description="Confirmação de bloqueio de acesso à plataforma"
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isPending}>
            <ShieldAlert aria-hidden="true" />
            <span>{isPending ? 'Inativando…' : 'Confirmar Inativação'}</span>
          </Button>
        </>
      }
    >
      <div className={styles['deactivate-modal']}>
        <p className={styles['deactivate-modal__text']}>
          Tem certeza de que deseja inativar o acesso de <strong>{user.name}</strong> ({user.email})?
        </p>
        <p className={styles['deactivate-modal__text']}>
          O colaborador não conseguirá mais realizar login via e-mail ou crachá NFC. O histórico de prescrições, evoluções clínicas e checagens beira-leito registradas por ele permanecerá íntegro e auditável no sistema.
        </p>
      </div>
    </Modal>
  );
}

type ReactivateConfirmModalProps = {
  user: IUser;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function ReactivateConfirmModal({
  user,
  isPending,
  onClose,
  onConfirm,
}: ReactivateConfirmModalProps) {
  return (
    <Modal
      title="Reativar Colaborador"
      description="Confirmação de restauração de acesso à plataforma"
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={isPending}>
            <Power aria-hidden="true" />
            <span>{isPending ? 'Reativando…' : 'Confirmar Reativação'}</span>
          </Button>
        </>
      }
    >
      <div className={styles['reactivate-modal']}>
        <p className={styles['reactivate-modal__text']}>
          Deseja restaurar o acesso de <strong>{user.name}</strong> ({user.email})?
        </p>
        <p className={styles['reactivate-modal__text']}>
          O colaborador voltará a ter permissão de login com suas credenciais e poderá utilizar seu crachá NFC para autenticação por aproximação.
        </p>
      </div>
    </Modal>
  );
}
