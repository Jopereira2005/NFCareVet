import { useMutation, useQuery } from '@tanstack/react-query';

import { nfcTagService } from '@/services/nfc-tag.service';
import { dashboardQueries, nfcTagQueries, patientQueries } from '@/services/query-options';

const TAG_INVENTORY_DEPENDENTS = [nfcTagQueries.all(), dashboardQueries.all(), patientQueries.all()];

export const useNfcTags = () => useQuery(nfcTagQueries.list());

export const useCreateNfcTag = () =>
  useMutation({
    mutationFn: (tagUid: string) => nfcTagService.create(tagUid),
    meta: {
      successMessage: 'Tag NFC cadastrada no inventário',
      errorMessage: 'Não foi possível cadastrar a tag NFC',
      invalidates: TAG_INVENTORY_DEPENDENTS,
    },
  });

export const useInactivateNfcTag = () =>
  useMutation({
    mutationFn: (id: string) => nfcTagService.inactivate(id),
    meta: {
      successMessage: 'Tag NFC inativada',
      errorMessage: 'Não foi possível inativar a tag NFC',
      invalidates: TAG_INVENTORY_DEPENDENTS,
    },
  });

export const useActivateNfcTag = () =>
  useMutation({
    mutationFn: (id: string) => nfcTagService.activate(id),
    meta: {
      successMessage: 'Tag NFC reativada',
      errorMessage: 'Não foi possível reativar a tag NFC',
      invalidates: TAG_INVENTORY_DEPENDENTS,
    },
  });

export const useDeleteNfcTag = () =>
  useMutation({
    mutationFn: (id: string) => nfcTagService.remove(id),
    meta: {
      successMessage: 'Tag NFC excluída do inventário',
      errorMessage: 'Não foi possível excluir a tag NFC',
      invalidates: TAG_INVENTORY_DEPENDENTS,
    },
  });
