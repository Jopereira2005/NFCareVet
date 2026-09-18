import { Test, TestingModule } from '@nestjs/testing';
import { BedsideService } from './bedside.service';
import { BedsideRepository } from './bedside.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrescriptionStatus, PrescriptionItemType } from '@prisma/client';

describe('BedsideService', () => {
  let service: BedsideService;
  let repository: any;

  const mockTag = {
    id: 'tag-1',
    publicCode: 'tag-thor-01',
    hospitalization: {
      id: 'hosp-1',
      kennel: { id: 'k-1', name: 'Baia 02', notes: 'Médio porte' },
      patient: {
        id: 'pat-1',
        name: 'Thor',
        species: 'Canina',
        breed: 'Golden Retriever',
        weightKg: 32.5,
        photoUrl: null,
        allergies: 'Dipirona',
        isFasting: true,
        behaviorNotes: 'Dócil',
        guardian: {
          id: 'g-1',
          name: 'Carlos',
          phone: '15999998888',
          email: 'carlos@gmail.com',
          cpf: '123.456.789-00',
        },
      },
      prescriptions: [],
      clinicalEvents: [],
    },
  };

  beforeEach(async () => {
    repository = {
      findTagWithActiveHospitalization: jest.fn(),
      findPrescriptionItemById: jest.fn(),
      applyPrescriptionItem: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BedsideService,
        { provide: BedsideRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<BedsideService>(BedsideService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQuickRecordByTag', () => {
    it('should return hospitalization data when tag exists and has active hospitalization', async () => {
      repository.findTagWithActiveHospitalization.mockResolvedValue(mockTag);

      const result = await service.getQuickRecordByTag('tag-thor-01');

      expect(result.hospitalizationId).toBe('hosp-1');
      expect(result.patient.name).toBe('Thor');
      expect(result.patient.guardian.name).toBe('Carlos');
      expect(result.kennel.name).toBe('Baia 02');
    });

    it('should throw NotFoundException when tag or active hospitalization is missing', async () => {
      repository.findTagWithActiveHospitalization.mockResolvedValue(null);

      await expect(service.getQuickRecordByTag('invalid-tag')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('applyMedication', () => {
    it('should apply medication item and create clinical event successfully', async () => {
      const mockItem = {
        id: 'item-1',
        title: 'Cefalotina',
        status: PrescriptionStatus.PENDING,
        itemType: PrescriptionItemType.MEDICATION,
      };

      repository.findPrescriptionItemById.mockResolvedValue(mockItem);
      repository.applyPrescriptionItem.mockResolvedValue({
        updatedItem: { ...mockItem, status: PrescriptionStatus.APPLIED },
        clinicalEvent: { id: 'evt-1', title: 'Execução: Cefalotina' },
      });

      const result = await service.applyMedication('item-1', 'user-1', 'Notes');

      expect(result.message).toBe('Procedimento registrado com sucesso');
      expect(result.prescriptionItem.status).toBe(PrescriptionStatus.APPLIED);
    });

    it('should throw BadRequestException if item is already applied', async () => {
      repository.findPrescriptionItemById.mockResolvedValue({
        id: 'item-1',
        status: PrescriptionStatus.APPLIED,
      });

      await expect(
        service.applyMedication('item-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
