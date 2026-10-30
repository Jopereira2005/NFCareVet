import { z } from 'zod';

import type { CreateGuardianPayload, Guardian, UpdateGuardianPayload } from '@/interfaces/guardian.types';
import { isValidCpf } from '@/utils/isValidCpf';

const PHONE_DIGITS = { min: 10, max: 11 };

export const guardianFormSchema = z.object({
  name: z.string().trim().min(3, 'Informe o nome completo do tutor').max(100, 'Use no máximo 100 caracteres'),
  phone: z
    .string()
    .trim()
    .refine((value) => {
      const digits = value.replace(/\D/g, '').length;
      return digits >= PHONE_DIGITS.min && digits <= PHONE_DIGITS.max;
    }, 'Informe um telefone com DDD'),
  cpf: z.string().trim().refine((value) => !value || isValidCpf(value), 'CPF inválido'),
  email: z.union([z.literal(''), z.email('E-mail inválido')]),
  address: z.string().trim().max(200, 'Use no máximo 200 caracteres'),
});

export type GuardianFormValues = z.infer<typeof guardianFormSchema>;

export const GUARDIAN_FORM_DEFAULTS: GuardianFormValues = { name: '', phone: '', cpf: '', email: '', address: '' };

/** Empty optional fields are omitted, as the API expects. */
export const toCreateGuardianPayload = ({ name, phone, cpf, email, address }: GuardianFormValues): CreateGuardianPayload => ({
  name,
  phone,
  cpf: cpf || undefined,
  email: email || undefined,
  address: address || undefined,
});

export const toGuardianFormValues = (guardian: Guardian): GuardianFormValues => ({
  name: guardian.name,
  phone: guardian.phone,
  cpf: guardian.cpf ?? '',
  email: guardian.email ?? '',
  address: guardian.address ?? '',
});

/** Form → PATCH body; cleared fields go as empty strings so the API erases them. */
export const toUpdateGuardianPayload = (values: GuardianFormValues): UpdateGuardianPayload => ({ ...values });
