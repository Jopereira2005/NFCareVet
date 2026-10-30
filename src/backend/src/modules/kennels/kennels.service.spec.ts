import { Test, TestingModule } from '@nestjs/testing';
import { KennelsService } from './kennels.service';
import {
  KennelsRepository,
  KennelWithActiveOccupancy,
} from './kennels.repository';

describe('KennelsService', () => {
  let service: KennelsService;
  let repository: jest.Mocked<KennelsRepository>;

  const mockKennels: KennelWithActiveOccupancy[] = [
    {
      id: 'kennel-01',
      name: 'Baia 01 - UTI Canina',
      notes: 'Monitoramento intensivo',
      isActive: true,
      createdAt: new Date('2025-01-10T12:00:00.000Z'),
      hospitalizations: [
        {
          id: 'hosp-1',
          patient: {
            id: 'patient-1',
            name: 'Thor',
          },
        },
      ],
    },
    {
      id: 'kennel-02',
      name: 'Baia 02 - Canil Médio',
      notes: null,
      isActive: true,
      createdAt: new Date('2025-01-10T12:00:00.000Z'),
      hospitalizations: [],
    },
  ];

  beforeEach(async () => {
    const mockRepo = {
      findAllActiveWithOccupant: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KennelsService,
        { provide: KennelsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<KennelsService>(KennelsService);
    repository = module.get(KennelsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listActive', () => {
    it('should return active kennels with occupant or null when free', async () => {
      repository.findAllActiveWithOccupant.mockResolvedValue(mockKennels);

      const result = await service.listActive();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'kennel-01',
        name: 'Baia 01 - UTI Canina',
        notes: 'Monitoramento intensivo',
        isActive: true,
        createdAt: new Date('2025-01-10T12:00:00.000Z'),
        occupant: {
          patientId: 'patient-1',
          patientName: 'Thor',
        },
      });
      expect(result[1]).toEqual({
        id: 'kennel-02',
        name: 'Baia 02 - Canil Médio',
        notes: null,
        isActive: true,
        createdAt: new Date('2025-01-10T12:00:00.000Z'),
        occupant: null,
      });
    });
  });
});
