import { PrismaClient, UserRole, HospitalizationStatus, PrescriptionStatus, AdministrationRoute } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Cria usuário veterinário
  const vet = await prisma.user.upsert({
    where: { email: 'madalena@nfcarevet.com' },
    update: {},
    create: {
      name: 'Dra. Madalena Silva',
      email: 'madalena@nfcarevet.com',
      passwordHash: '$2b$10$fictitiousHashForDevOnly',
      role: UserRole.VET,
    },
  });

  // 2. Cria tag NFC de inventário
  const tag = await prisma.nfcTag.upsert({
    where: { tagUid: '04A23B89C16080' },
    update: {},
    create: {
      tagUid: '04A23B89C16080',
      publicCode: 'tag-thor-01',
    },
  });

  // 3. Cria paciente com alertas clínicos
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

  // 4. Cria a internação ativa vinculando o pet à baia e à tag
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

  console.log(`Seed concluído com sucesso: Paciente ${patient.name} internado na tag ${tag.publicCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });