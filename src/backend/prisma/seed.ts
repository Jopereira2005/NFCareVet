import {
  PrismaClient,
  UserRole,
  HospitalizationStatus,
  PrescriptionStatus,
  PrescriptionItemType,
  AdministrationRoute,
  EventType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de dados do NFCareVet...');

  // Limpa as tabelas na ordem correta devido a FK constraints
  await prisma.clinicalEvent.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.hospitalization.deleteMany();
  await prisma.nfcTag.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.guardian.deleteMany();
  await prisma.kennel.deleteMany();
  await prisma.user.deleteMany();

  // Hashes de senha
  const defaultPasswordHash = await bcrypt.hash('admin123', 10);
  const vetPasswordHash = await bcrypt.hash('vet12345', 10);
  const recPasswordHash = await bcrypt.hash('rec12345', 10);

  // 1. Usuários
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

  // 2. Tutor (Guardian)
  const guardian = await prisma.guardian.create({
    data: {
      name: 'Carlos Eduardo',
      cpf: '123.456.789-00',
      email: 'carlos@gmail.com',
      phone: '15999998888',
    },
  });

  // 3. Paciente (Patient)
  const patient = await prisma.patient.create({
    data: {
      guardianId: guardian.id,
      name: 'Thor',
      species: 'Canina',
      breed: 'Golden Retriever',
      weightKg: 32.5,
      allergies: 'Alérgico a Dipirona',
      isFasting: true,
      behaviorNotes: 'Dócil, mas assustado com manipulação de patas',
    },
  });

  // 4. Kennel (Baia)
  const kennel = await prisma.kennel.create({
    data: {
      name: 'Baia 02 - Canil Médio',
      notes: 'Baia com aquecimento e colchão ortopédico',
      isActive: true,
    },
  });

  // 5. Tag NFC
  const tag = await prisma.nfcTag.create({
    data: {
      tagUid: '04A23B89C16080',
      publicCode: 'tag-thor-01',
      active: true,
    },
  });

  // 6. Internação
  const hospitalization = await prisma.hospitalization.create({
    data: {
      patientId: patient.id,
      kennelId: kennel.id,
      nfcTagId: tag.id,
      admissionReason: 'Pós-operatório ortopédico',
      status: HospitalizationStatus.ACTIVE,
    },
  });

  // 7. Prescrição Medica e Itens
  const prescription = await prisma.prescription.create({
    data: {
      hospitalizationId: hospitalization.id,
      prescribedById: vetUser.id,
      generalRecommendations: 'Manter paciente sob repouso e monitorar temperatura corporal.',
      isActive: true,
      items: {
        create: [
          {
            itemType: PrescriptionItemType.MEDICATION,
            title: 'Cefalotina',
            dosage: '30 mg/kg (IV)',
            route: AdministrationRoute.INTRAVENOUS,
            scheduledTime: new Date(Date.now() + 1000 * 60 * 30), // 30 min
            status: PrescriptionStatus.PENDING,
            instructions: 'Aplicação intravenosa lenta.',
          },
          {
            itemType: PrescriptionItemType.MEDICATION,
            title: 'Tramadol',
            dosage: '3 mg/kg (SC)',
            route: AdministrationRoute.SUBCUTANEOUS,
            scheduledTime: new Date(Date.now() + 1000 * 60 * 120), // 2h
            status: PrescriptionStatus.PENDING,
            instructions: 'Aplicação via subcutânea.',
          },
          {
            itemType: PrescriptionItemType.VITAL_CHECK,
            title: 'Checagem de Sinais Vitais',
            scheduledTime: new Date(Date.now() + 1000 * 60 * 15), // 15 min
            status: PrescriptionStatus.PENDING,
            instructions: 'Aferir FC, FR, Tª e TPC.',
          },
        ],
      },
    },
  });

  // 8. Evento Clínico Inicial
  await prisma.clinicalEvent.create({
    data: {
      hospitalizationId: hospitalization.id,
      userId: vetUser.id,
      eventType: EventType.OBSERVATION,
      title: 'Admissão na Baia',
      description: 'Paciente alocado na baia após cirurgia ortopédica. Sinais vitais estáveis.',
      metrics: { temperature: 38.5, heartRate: 110 },
    },
  });

  console.log('Seed concluído com sucesso!');
  console.log(`- Usuários: ADMIN (${adminUser.email}), VET (${vetUser.email}), REC (${recUser.email})`);
  console.log(`- Paciente internado: ${patient.name} (Tutor: ${guardian.name}) na baia "${kennel.name}" com NFC ${tag.publicCode}`);
}

main()
  .catch((e) => {
    console.error('Erro ao executar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });