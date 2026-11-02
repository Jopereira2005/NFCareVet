import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BedsideModule } from './modules/bedside/bedside.module';
import { HealthModule } from './modules/health/health.module';
import { NfcTagsModule } from './modules/nfc-tags/nfc-tags.module';
import { HospitalizationsModule } from './modules/hospitalizations/hospitalizations.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { PatientsModule } from './modules/patients/patients.module';
import { GuardiansModule } from './modules/guardians/guardians.module';
import { KennelsModule } from './modules/kennels/kennels.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 60,
      },
    ]),
    PrismaModule,
    StorageModule,
    UsersModule,
    AuthModule,
    BedsideModule,
    HealthModule,
    NfcTagsModule,
    HospitalizationsModule,
    PrescriptionsModule,
    PatientsModule,
    GuardiansModule,
    KennelsModule,
    RegistrationsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
