import { Injectable } from '@nestjs/common';
import { PatientsService } from '../patients/patients.service';
import { GuardiansService } from '../guardians/guardians.service';
import { RecentRegistrationResponse } from './dto/recent-registration-response.dto';

function getRegisteredAt(registration: RecentRegistrationResponse): Date {
  return registration.kind === 'patient'
    ? new Date(registration.patient.createdAt)
    : new Date(registration.guardian.createdAt);
}

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly guardiansService: GuardiansService,
  ) {}

  async listRecent(limit = 3): Promise<RecentRegistrationResponse[]> {
    const [recentPatients, recentGuardians] = await Promise.all([
      this.patientsService.listRecent(limit),
      this.guardiansService.listRecent(limit),
    ]);

    const combined: RecentRegistrationResponse[] = [
      ...recentPatients.map((patient) => ({
        kind: 'patient' as const,
        patient,
      })),
      ...recentGuardians.map((guardian) => ({
        kind: 'guardian' as const,
        guardian,
      })),
    ];

    combined.sort(
      (a, b) => getRegisteredAt(b).getTime() - getRegisteredAt(a).getTime(),
    );

    return combined.slice(0, limit);
  }
}
