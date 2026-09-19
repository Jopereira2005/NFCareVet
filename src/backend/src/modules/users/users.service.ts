import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from './repositories/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingEmail = await this.usersRepository.findByEmail(
      createUserDto.email,
    );
    if (existingEmail) {
      throw new ConflictException(
        'Já existe um usuário cadastrado com este e-mail.',
      );
    }

    if (createUserDto.badgeUid) {
      const existingBadge = await this.usersRepository.findByBadgeUid(
        createUserDto.badgeUid,
      );
      if (existingBadge) {
        throw new ConflictException(
          'Este crachá NFC (badgeUid) já está associado a outro usuário.',
        );
      }
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.usersRepository.create({
      name: createUserDto.name,
      email: createUserDto.email.toLowerCase(),
      passwordHash,
      role: createUserDto.role,
      badgeUid: createUserDto.badgeUid || null,
      active: createUserDto.active ?? true,
    });

    return this.toResponseDto(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.findAll();
    return users.map((user) => this.toResponseDto(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
    }
    return this.toResponseDto(user);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const existingUser = await this.usersRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
    }

    if (
      updateUserDto.email &&
      updateUserDto.email.toLowerCase() !== existingUser.email
    ) {
      const emailConflict = await this.usersRepository.findByEmail(
        updateUserDto.email,
      );
      if (emailConflict) {
        throw new ConflictException(
          'Já existe outro usuário cadastrado com este e-mail.',
        );
      }
    }

    if (
      updateUserDto.badgeUid &&
      updateUserDto.badgeUid !== existingUser.badgeUid
    ) {
      const badgeConflict = await this.usersRepository.findByBadgeUid(
        updateUserDto.badgeUid,
      );
      if (badgeConflict) {
        throw new ConflictException(
          'Este crachá NFC (badgeUid) já está associado a outro usuário.',
        );
      }
    }

    const dataToUpdate: any = {
      ...(updateUserDto.name && { name: updateUserDto.name }),
      ...(updateUserDto.email && { email: updateUserDto.email.toLowerCase() }),
      ...(updateUserDto.role && { role: updateUserDto.role }),
      ...(updateUserDto.badgeUid !== undefined && {
        badgeUid: updateUserDto.badgeUid || null,
      }),
      ...(updateUserDto.active !== undefined && {
        active: updateUserDto.active,
      }),
    };

    if (updateUserDto.password) {
      dataToUpdate.passwordHash = await bcrypt.hash(
        updateUserDto.password,
        10,
      );
    }

    const updatedUser = await this.usersRepository.update(id, dataToUpdate);
    return this.toResponseDto(updatedUser);
  }

  async remove(id: string): Promise<{ message: string }> {
    const existingUser = await this.usersRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
    }

    await this.usersRepository.update(id, { active: false });
    return {
      message: `Usuário "${existingUser.name}" desativado com sucesso.`,
    };
  }

  private toResponseDto(user: User): UserResponseDto {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
