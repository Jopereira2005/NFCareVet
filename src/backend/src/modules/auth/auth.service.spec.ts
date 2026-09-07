import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/repositories/users.repository';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: any;
  let jwtService: any;

  const mockUser = {
    id: 'user-uuid-123',
    name: 'Dr. Silva',
    email: 'silva@nfcarevet.com',
    passwordHash: '$2a$10$abcdefghijklmnopqrstuu',
    role: UserRole.VET,
    badgeUid: 'NFC-BADGE-12345',
    active: true,
  };

  beforeEach(async () => {
    usersRepository = {
      findByEmail: jest.fn(),
      findByBadgeUid: jest.fn(),
      findById: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked_jwt_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return accessToken and user data on valid email and password', async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      const result = await service.login({
        email: 'silva@nfcarevet.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('mocked_jwt_token');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.role).toBe(UserRole.VET);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@nfcarevet.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if user is inactive', async () => {
      usersRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        active: false,
      });

      await expect(
        service.login({
          email: 'silva@nfcarevet.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('badgeLogin', () => {
    it('should return accessToken on valid NFC badge login', async () => {
      usersRepository.findByBadgeUid.mockResolvedValue(mockUser);

      const result = await service.badgeLogin({
        badgeUid: 'NFC-BADGE-12345',
      });

      expect(result.accessToken).toBe('mocked_jwt_token');
      expect(result.user.badgeUid).toBe('NFC-BADGE-12345');
    });

    it('should throw UnauthorizedException if badge UID is not registered', async () => {
      usersRepository.findByBadgeUid.mockResolvedValue(null);

      await expect(
        service.badgeLogin({ badgeUid: 'UNKNOWN_BADGE' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
