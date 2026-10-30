import { z } from 'zod';

import type { CreatePatientPayload, Patient, PatientSex, UpdatePatientPayload } from '@/interfaces/patient.types';
import { parseDecimal } from '@/utils/parseDecimal';

export const PATIENT_SPECIES = ['Canina', 'Felina'] as const;
const PATIENT_SEXES = ['MALE', 'FEMALE'] as const;
const MAX_WEIGHT_KG = 150;

// Plain boolean (not a type guard), so the form keeps `string` values and can start empty
const isOneOf = (options: readonly string[]) => (value: string) => options.includes(value);

export const patientFormSchema = z.object({
  guardianId: z.string().min(1, 'Selecione o tutor'),
  name: z.string().trim().min(2, 'Informe o nome do pet').max(60, 'Use no máximo 60 caracteres'),
  species: z.string().refine(isOneOf(PATIENT_SPECIES), 'Selecione a espécie'),
  sex: z.string().refine((value) => !value || isOneOf(PATIENT_SEXES)(value), 'Sexo inválido'),
  breed: z.string().trim().max(60, 'Use no máximo 60 caracteres'),
  birthDate: z.string().refine((value) => !value || Date.parse(value) <= Date.now(), 'A data não pode estar no futuro'),
  weightKg: z.string().refine((value) => {
    if (!value.trim()) return true;
    const weight = parseDecimal(value);
    return weight !== undefined && weight > 0 && weight <= MAX_WEIGHT_KG;
  }, `Informe um peso entre 0 e ${MAX_WEIGHT_KG} kg`),
  bloodType: z.string().trim().max(20, 'Use no máximo 20 caracteres'),
  isCastrated: z.boolean(),
  allergies: z.string().trim().max(200, 'Use no máximo 200 caracteres'),
  behaviorNotes: z.string().trim().max(300, 'Use no máximo 300 caracteres'),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

export const getPatientFormDefaults = (guardianId = ''): PatientFormValues => ({
  guardianId,
  name: '',
  species: '',
  sex: '',
  breed: '',
  birthDate: '',
  weightKg: '',
  bloodType: '',
  isCastrated: false,
  allergies: '',
  behaviorNotes: '',
});

/** Form strings → API payload: empty optional fields are omitted and the weight becomes a number. */
export const toCreatePatientPayload = (values: PatientFormValues): CreatePatientPayload => ({
  guardianId: values.guardianId,
  name: values.name,
  species: values.species,
  sex: (values.sex || undefined) as PatientSex | undefined,
  breed: values.breed || undefined,
  birthDate: values.birthDate || undefined,
  weightKg: parseDecimal(values.weightKg),
  bloodType: values.bloodType || undefined,
  isCastrated: values.isCastrated,
  allergies: values.allergies || undefined,
  behaviorNotes: values.behaviorNotes || undefined,
});

/** Patient → form strings, for the edit dialog ("28.4" → "28,4"). */
export const toPatientFormValues = (patient: Patient): PatientFormValues => ({
  guardianId: patient.guardianId,
  name: patient.name,
  species: patient.species,
  sex: patient.sex ?? '',
  breed: patient.breed ?? '',
  birthDate: patient.birthDate ? String(patient.birthDate).slice(0, 10) : '',
  weightKg: patient.weightKg === null || patient.weightKg === undefined ? '' : String(patient.weightKg).replace('.', ','),
  bloodType: patient.bloodType ?? '',
  isCastrated: patient.isCastrated,
  allergies: patient.allergies ?? '',
  behaviorNotes: patient.behaviorNotes ?? '',
});

/**
 * Form → PATCH body. Unlike creation, cleared fields must be sent so the API erases them:
 * nullable fields go as `null`, free-text fields as an empty string.
 */
export const toUpdatePatientPayload = (values: PatientFormValues): UpdatePatientPayload => ({
  name: values.name,
  species: values.species,
  sex: (values.sex || null) as PatientSex | null,
  breed: values.breed,
  birthDate: values.birthDate || null,
  weightKg: parseDecimal(values.weightKg),
  bloodType: values.bloodType || null,
  isCastrated: values.isCastrated,
  allergies: values.allergies,
  behaviorNotes: values.behaviorNotes,
});
