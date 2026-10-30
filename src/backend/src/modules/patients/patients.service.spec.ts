import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HospitalizationStatus, PatientSex, Prisma } from '@prisma/client';
import { PatientsService } from './patients.service';
import { PatientsRepository } from './patients.repository';
import { PatientSex as CommonPatientSex } from '@nfcarevet/common';

describe('PatientsService', () => {
  let service: PatientsService;
  let repository: jest.Mocked<PatientsRepository>;

  const now = new Date('2026-10-10T12:00:00.000Z');

  const mockGuardian = {
    id: 'guardian-1',
    name: 'Carlos Eduardo Santos',
    cpf: '123.456.789-01',
    email: 'carlos@email.com',
    phone: '(15) 99123-4567',
    createdAt: now,
    updatedAt: now,
  };

  const mockPatientRecord = {
    id: 'patient-1',
    guardianId: 'guardian-1',
    name: 'Thor',
    species: 'Canina',
    breed: 'Golden Retriever',
    sex: PatientSex.MALE,
    birthDate: new Date('2022-04-10T00:00:00.000Z'),
    bloodType: 'DEA 1.1+',
    weightKg: new Prisma.Decimal(32.5),
    photoUrl: null,
    allergies: 'Dipirona',
    isFasting: true,
    isCastrated: true,
    behaviorNotes: 'Manso',
    createdAt: now,
    updatedAt: now,
    guardian: mockGuardian,
    hospitalizations: [
      {
        id: 'hosp-1',
        patientId: 'patient-1',
        kennelId: 'kennel-1',
        nfcTagId: 'tag-1',
        admissionReason: 'Gastroenterite',
        status: HospitalizationStatus.ACTIVE,
        admissionDate: now,
        dischargeDate: null,
        kennel: {
          id: 'kennel-1',
          name: 'Baia 01 - UTI',
          notes: null,
          isActive: true,
          createdAt: now,
        },
        nfcTag: {
          id: 'tag-1',
          tagUid: '04A1B2C3D48831',
          publicCode: 'VET-8831',
          active: true,
          createdAt: now,
        },
      },
    ],
  };

  beforeEach(async () => {
    const mockRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findVisitsByPeriod: jest.fn(),
      findGuardianById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PatientsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    repository = module.get(PatientsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return formatted patient with guardian, nfcTag and activeHospitalization', async () => {
      repository.findById.mockResolvedValue(mockPatientRecord);

      const result = await service.findById('patient-1');

      expect(result.id).toBe('patient-1');
      expect(result.weightKg).toBe(32.5);
      expect(result.guardian?.name).toBe('Carlos Eduardo Santos');
      expect(result.nfcTag?.publicCode).toBe('VET-8831');
      expect(result.activeHospitalization?.id).toBe('hosp-1');
      expect(result.activeHospitalization?.kennel?.name).toBe('Baia 01 - UTI');
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('search', () => {
    it('should filter by accent-insensitive query matching name, guardian or tag publicCode', async () => {
      repository.findAll.mockResolvedValue([mockPatientRecord]);

      const byTag = await service.search({ query: 'vet-8831' });
      expect(byTag).toHaveLength(1);

      const byGuardian = await service.search({ query: 'carlos eduardo' });
      expect(byGuardian).toHaveLength(1);

      const noMatch = await service.search({ query: 'inexistente' });
      expect(noMatch).toHaveLength(0);
    });
  });

  describe('listVisits', () => {
    it('should return visits mapped with admissionDate as visitedAt', async () => {
      repository.findVisitsByPeriod.mockResolvedValue([
        {
          id: 'hosp-1',
          patientId: 'patient-1',
          kennelId: 'kennel-1',
          nfcTagId: 'tag-1',
          admissionReason: 'Gastroenterite',
          status: HospitalizationStatus.ACTIVE,
          admissionDate: now,
          dischargeDate: null,
          patient: mockPatientRecord,
        },
      ]);

      const visits = await service.listVisits('today');

      expect(visits).toHaveLength(1);
      expect(visits[0].id).toBe('hosp-1');
      expect(visits[0].visitedAt).toEqual(now);
      expect(visits[0].patient.name).toBe('Thor');
    });
  });

  describe('create', () => {
    it('should create patient when guardian exists', async () => {
      repository.findGuardianById.mockResolvedValue(mockGuardian);
      repository.create.mockResolvedValue({
        ...mockPatientRecord,
        hospitalizations: [],
      });

      const created = await service.create({
        guardianId: 'guardian-1',
        name: 'Thor',
        species: 'Canina',
        sex: CommonPatientSex.MALE,
        weightKg: 32.5,
      });

      expect(created.name).toBe('Thor');
      expect(created.activeHospitalization).toBeNull();
      expect(created.nfcTag).toBeNull();
    });

    it('should throw NotFoundException when guardian does not exist', async () => {
      repository.findGuardianById.mockResolvedValue(null);

      await expect(
        service.create({
          guardianId: 'missing-guardian',
          name: 'Thor',
          species: 'Canina',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update patient and normalize empty strings to null', async () => {
      repository.findById.mockResolvedValue(mockPatientRecord);
      repository.update.mockResolvedValue({
        ...mockPatientRecord,
        breed: null,
        allergies: null,
      });

      const updated = await service.update('patient-1', {
        breed: '',
        allergies: '',
      });

      expect(repository.update).toHaveBeenCalledWith(
        'patient-1',
        expect.objectContaining({
          breed: null,
          allergies: null,
        }),
      );
      expect(updated.breed).toBeNull();
    });

    it('should throw NotFoundException when updating non-existent patient', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('missing', { name: 'Novo Nome' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
