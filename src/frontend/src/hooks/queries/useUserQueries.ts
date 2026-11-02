import { useMutation, useQuery } from '@tanstack/react-query';
import type { ICreateUserPayload, IUpdateUserPayload } from '@nfcarevet/common';

import { userService } from '@/services/user.service';
import { userQueries } from '@/services/query-options';

const USER_DEPENDENTS = [userQueries.all()];

export const useUsers = () => useQuery(userQueries.list());

export const useCreateUser = () =>
  useMutation({
    mutationFn: (payload: ICreateUserPayload) => userService.create(payload),
    meta: {
      successMessage: 'Colaborador cadastrado com sucesso',
      errorMessage: 'Não foi possível cadastrar o colaborador',
      invalidates: USER_DEPENDENTS,
    },
  });

export const useUpdateUser = () =>
  useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: IUpdateUserPayload }) => userService.update(id, payload),
    meta: {
      successMessage: 'Colaborador atualizado com sucesso',
      errorMessage: 'Não foi possível atualizar o colaborador',
      invalidates: USER_DEPENDENTS,
    },
  });

export const useDeleteUser = () =>
  useMutation({
    mutationFn: (id: string) => userService.remove(id),
    meta: {
      successMessage: 'Colaborador inativado com sucesso',
      errorMessage: 'Não foi possível inativar o colaborador',
      invalidates: USER_DEPENDENTS,
    },
  });
