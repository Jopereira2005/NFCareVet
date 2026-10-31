import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PatientSex, Prisma } from '@prisma/client';
import { GuardiansService } from './guardians.service';
import { GuardiansRepository } from './guardians.repository';

describe('GuardiansService', () => {
  let service: GuardiansService;
  let repository: jest.Mocked<GuardiansRepository>;

  const now = new Date('2026-10-10T12:00:00.000Z');

  const mockGuardianWithPatients = {
    id: 'guardian-1',
    name: 'Lucas Silva de Oliveira',
    cpf: '111.444.777-35',
    email: 'lucas.silva@email.com',
    phone: '(15) 99123-3292',
    address: 'Rua das Palmeiras, 450',
    photoUrl: null,
    isActive: true,
    financialStatus: null,
    paymentMethod: null,
    createdAt: now,
    updatedAt: now,
    patients: [
      {
        id: 'patient-1',
        guardianId: 'guardian-1',
        name: 'Thor',
        species: 'Canina',
        breed: 'Golden Retriever',
        sex: PatientSex.MALE,
        birthDate: new Date('2022-04-10T00:00:00.000Z'),
        bloodType: 'DEA 1.1+',
        weightKg: new Prisma.Decimal(28.4),
        photoUrl: null,
        allergies: 'Dipirona',
        treatments: ['Dermatite atópica'],
        isFasting: false,
        isCastrated: true,
        behaviorNotes: null,
        createdAt: now,
        updatedAt: now,
        hospitalizations: [],
      },
    ],
  };

  beforeEach(async () => {
    const mockRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByCpf: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuardiansService,
        { provide: GuardiansRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<GuardiansService>(GuardiansService);
    repository = module.get(GuardiansRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return guardian with patients', async () => {
      repository.findById.mockResolvedValue(mockGuardianWithPatients);

      const result = await service.findById('guardian-1');

      expect(result.id).toBe('guardian-1');
      expect(result.isActive).toBe(true);
      expect(result.patients).toHaveLength(1);
      expect(result.patients[0].name).toBe('Thor');
    });

    it('should throw NotFoundException when guardian does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('search', () => {
    it('should match guardian by name, CPF or pet name', async () => {
      repository.findAll.mockResolvedValue([mockGuardianWithPatients]);

      const byName = await service.search('lucas');
      expect(byName).toHaveLength(1);

      const byCpf = await service.search('111444777');
      expect(byCpf).toHaveLength(1);

      const byPet = await service.search('thor');
      expect(byPet).toHaveLength(1);

      const noMatch = await service.search('inexistente');
      expect(noMatch).toHaveLength(0);
    });
  });

  describe('create', () => {
    it('should create guardian when CPF is not in use', async () => {
      repository.findByCpf.mockResolvedValue(null);
      repository.create.mockResolvedValue({
        ...mockGuardianWithPatients,
        patients: [],
      });

      const created = await service.create({
        name: 'Lucas Silva de Oliveira',
        phone: '(15) 99123-3292',
        cpf: '111.444.777-35',
        email: 'lucas.silva@email.com',
        address: 'Rua das Palmeiras, 450',
      });

      expect(created.name).toBe('Lucas Silva de Oliveira');
      expect(created.patients).toEqual([]);
    });

    it('should throw ConflictException when CPF is already registered', async () => {
      repository.findByCpf.mockResolvedValue(mockGuardianWithPatients);

      await expect(
        service.create({
          name: 'Outro Tutor',
          phone: '(15) 99999-9999',
          cpf: '111.444.777-35',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update guardian and clear empty optional fields', async () => {
      repository.findById.mockResolvedValue(mockGuardianWithPatients);
      repository.update.mockResolvedValue({
        ...mockGuardianWithPatients,
        cpf: null,
        email: null,
        address: null,
      });

      const updated = await service.update('guardian-1', {
        cpf: '',
        email: '',
        address: '',
      });

      expect(repository.update).toHaveBeenCalledWith(
        'guardian-1',
        expect.objectContaining({
          cpf: null,
          email: null,
          address: null,
        }),
      );
      expect(updated.cpf).toBeNull();
    });
  });
});
