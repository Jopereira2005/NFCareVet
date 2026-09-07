import {
  PrismaClient,
  UserRole,
  HospitalizationStatus,
  PrescriptionStatus,
  AdministrationRoute,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de dados do NFCareVet...');

  // Limpa as tabelas existentes para permitir execuções repetidas (idempotência)
  await prisma.auditLog.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.hospitalization.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.nfcTag.deleteMany();
  await prisma.user.deleteMany();

  // Gera hashes reais de senha via bcryptjs
  const defaultPasswordHash = await bcrypt.hash('admin123', 10);
  const vetPasswordHash = await bcrypt.hash('vet12345', 10);
  const recPasswordHash = await bcrypt.hash('rec12345', 10);

  // 1. Seed do Usuário Administrador (Master/SysAdmin)
  const adminUser = await prisma.user.create({
    data: {
      name: 'Administrador NFCareVet',
      email: 'admin@nfcarevet.com',
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
      badgeUid: 'BADGE-ADMIN-001',
      active: true,
    },
  });

  // 2. Seed do Usuário Veterinário
  const vetUser = await prisma.user.create({
    data: {
      name: 'Dra. Madalena Silva',
      email: 'madalena@nfcarevet.com',
      passwordHash: vetPasswordHash,
      role: UserRole.VET,
      badgeUid: 'BADGE-VET-001',
      active: true,
    },
  });

  // 3. Seed do Usuário Recepcionista
  const recUser = await prisma.user.create({
    data: {
      name: 'Carlos Recepção',
      email: 'recepcao@nfcarevet.com',
      passwordHash: recPasswordHash,
      role: UserRole.REC,
      badgeUid: 'BADGE-REC-001',
      active: true,
    },
  });

  // 4. Cria tag NFC de inventário
  const tag = await prisma.nfcTag.create({
    data: {
      tagUid: '04A23B89C16080',
      publicCode: 'tag-thor-01',
    },
  });

  // 5. Cria paciente com alertas clínicos
  const patient = await prisma.patient.create({
    data: {
      name: 'Thor',
      species: 'Canina',
      breed: 'Golden Retriever',
      weightKg: 32.5,
      allergies: 'Alérgico a Dipirona',
      isFasting: true,
      behaviorNotes: 'Dócil, mas assustado com manipulação de patas',
      guardianName: 'Carlos Eduardo',
      guardianPhone: '15999998888',
    },
  });

  // 6. Cria a internação ativa vinculando o pet à baia e à tag
  const hospitalization = await prisma.hospitalization.create({
    data: {
      patientId: patient.id,
      nfcTagId: tag.id,
      kennelIdentifier: 'Baia 02 - Canil Médio',
      admissionReason: 'Pós-operatório ortopédico',
      status: HospitalizationStatus.ACTIVE,
      prescriptions: {
        create: [
          {
            medication: 'Cefalotina',
            dosage: '30 mg/kg (IV)',
            route: AdministrationRoute.INTRAVENOUS,
            scheduledTime: new Date(Date.now() + 1000 * 60 * 30), // Daqui 30 min
            status: PrescriptionStatus.PENDING,
          },
          {
            medication: 'Tramadol',
            dosage: '3 mg/kg (SC)',
            route: AdministrationRoute.SUBCUTANEOUS,
            scheduledTime: new Date(Date.now() + 1000 * 60 * 120), // Daqui 2h
            status: PrescriptionStatus.PENDING,
          },
        ],
      },
    },
  });

  console.log('Seed concluído com sucesso!');
  console.log(`- Usuários cadastrados: ADMIN (${adminUser.email}), VET (${vetUser.email}), REC (${recUser.email})`);
  console.log(`- Paciente internado: ${patient.name} na tag ${tag.publicCode} (Internação ID: ${hospitalization.id})`);
}

main()
  .catch((e) => {
    console.error('Erro ao executar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });