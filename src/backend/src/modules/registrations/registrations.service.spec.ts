import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationsService } from './registrations.service';
import { PatientsService } from '../patients/patients.service';
import { GuardiansService } from '../guardians/guardians.service';
import { PatientResponseDto } from '../patients/dto/patient-response.dto';
import { GuardianResponseDto } from '../guardians/dto/guardian-response.dto';

describe('RegistrationsService', () => {
  let service: RegistrationsService;
  let patientsService: jest.Mocked<PatientsService>;
  let guardiansService: jest.Mocked<GuardiansService>;

  const mockPatients: PatientResponseDto[] = [
    {
      id: 'patient-2',
      guardianId: 'guardian-1',
      name: 'Luna',
      species: 'Felino',
      breed: 'SRD',
      sex: 'FEMALE',
      birthDate: null,
      bloodType: null,
      weightKg: 4.1,
      photoUrl: null,
      allergies: null,
      isFasting: false,
      isCastrated: true,
      behaviorNotes: null,
      createdAt: new Date('2026-10-30T12:00:00.000Z'),
      updatedAt: new Date('2026-10-30T12:00:00.000Z'),
      nfcTag: null,
      activeHospitalization: null,
    },
    {
      id: 'patient-1',
      guardianId: 'guardian-1',
      name: 'Thor',
      species: 'Canino',
      breed: 'Golden Retriever',
      sex: 'MALE',
      birthDate: null,
      bloodType: null,
      weightKg: 28.5,
      photoUrl: null,
      allergies: null,
      isFasting: false,
      isCastrated: true,
      behaviorNotes: null,
      createdAt: new Date('2026-10-28T10:00:00.000Z'),
      updatedAt: new Date('2026-10-28T10:00:00.000Z'),
      nfcTag: null,
      activeHospitalization: null,
    },
  ];

  const mockGuardians: GuardianResponseDto[] = [
    {
      id: 'guardian-1',
      name: 'Ana Beatriz Costa',
      cpf: '123.456.789-00',
      email: 'ana@email.com',
      phone: '(15) 99999-0000',
      address: 'Rua A, 100',
      isActive: true,
      createdAt: new Date('2026-10-29T15:00:00.000Z'),
      updatedAt: new Date('2026-10-29T15:00:00.000Z'),
      patients: [],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationsService,
        {
          provide: PatientsService,
          useValue: { listRecent: jest.fn() },
        },
        {
          provide: GuardiansService,
          useValue: { listRecent: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<RegistrationsService>(RegistrationsService);
    patientsService = module.get(PatientsService);
    guardiansService = module.get(GuardiansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listRecent', () => {
    it('should merge recent patients and guardians sorted by createdAt desc and sliced to limit', async () => {
      patientsService.listRecent.mockResolvedValue(mockPatients);
      guardiansService.listRecent.mockResolvedValue(mockGuardians);

      const result = await service.listRecent(2);

      expect(patientsService.listRecent).toHaveBeenCalledWith(2);
      expect(guardiansService.listRecent).toHaveBeenCalledWith(2);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        kind: 'patient',
        patient: mockPatients[0],
      });
      expect(result[1]).toEqual({
        kind: 'guardian',
        guardian: mockGuardians[0],
      });
    });
  });
});
