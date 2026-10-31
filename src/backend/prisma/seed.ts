import {
  PrismaClient,
  UserRole,
  HospitalizationStatus,
  PrescriptionStatus,
  PrescriptionItemType,
  AdministrationRoute,
  EventType,
  PatientSex,
  FinancialStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Verificação de ambiente: O seed deve rodar estritamente em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '⚠️ [AVISO DE SEGURANÇA] O script de seed do NFCareVet é permitido exclusivamente em ambiente de desenvolvimento (NODE_ENV !== "production"). A execução foi cancelada.',
    );
    return;
  }

  console.log('🌱 Iniciando seed de dados de desenvolvimento do NFCareVet...');

  // 2. Limpeza das tabelas na ordem de dependência relacional (FKs)
  console.log('🧹 Limpando dados anteriores...');
  await prisma.clinicalEvent.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.hospitalization.deleteMany();
  await prisma.nfcTag.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.guardian.deleteMany();
  await prisma.kennel.deleteMany();
  await prisma.user.deleteMany();

  // 3. Usuários do Sistema
  console.log('👤 Criando usuários...');
  const defaultPasswordHash = await bcrypt.hash('admin123', 10);
  const vetPasswordHash = await bcrypt.hash('vet12345', 10);
  const recPasswordHash = await bcrypt.hash('rec12345', 10);

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

  // 4. Baias / Leitos (Kennels) - 8 baias no total para testar ocupação hospitalar
  console.log('🏥 Criando baias hospitalares...');
  const kennels = await Promise.all([
    prisma.kennel.create({
      data: {
        name: 'Baia 01 - UTI Canina',
        notes: 'Ponto de oxigênio contínuo, bomba de infusão e monitor multiparamétrico',
        isActive: true,
      },
    }),
    prisma.kennel.create({
      data: {
        name: 'Baia 02 - Canil Médio',
        notes: 'Baia com piso térmico e colchão ortopédico',
        isActive: true,
      },
    }),
    prisma.kennel.create({
      data: {
        name: 'Baia 03 - Gatil Especial',
        notes: 'Ambiente climatizado, silencioso com feromônio facial felino',
        isActive: true,
      },
    }),
    prisma.kennel.create({
      data: {
        name: 'Baia 04 - Isolamento Infeccioso',
        notes: 'Pressão negativa e antessala de paramentação',
        isActive: true,
      },
    }),
    prisma.kennel.create({
      data: {
        name: 'Baia 05 - Canil Grande',
        notes: 'Espaço amplo para cães de grande porte',
        isActive: true,
      },
    }),
    prisma.kennel.create({
      data: {
        name: 'Baia 06 - Canil Pequeno',
        notes: 'Baia com aquecimento para filhotes ou cães pequenos',
        isActive: true,
      },
    }),
    prisma.kennel.create({
      data: {
        name: 'Baia 07 - Gatil 02',
        notes: 'Gatil secundário para recuperação',
        isActive: true,
      },
    }),
    prisma.kennel.create({
      data: {
        name: 'Baia 08 - Semi-Intensiva',
        notes: 'Suporte para oxigenoterapia e observação contínua',
        isActive: true,
      },
    }),
  ]);

  // 5. Tutores (Guardians)
  console.log('👨‍👩‍👧 Criando tutores...');
  const guardianThor = await prisma.guardian.create({
    data: {
      name: 'Carlos Eduardo Santos',
      cpf: '123.456.789-01',
      email: 'carlos.santos@email.com',
      phone: '(15) 99123-4567',
      address: 'Rua das Palmeiras, 450 - Apto 82, Campolim - Sorocaba/SP',
      isActive: true,
      financialStatus: FinancialStatus.PAID,
      paymentMethod: 'Boleto',
    },
  });

  const guardianMel = await prisma.guardian.create({
    data: {
      name: 'Mariana Costa Ferreira',
      cpf: '234.567.890-12',
      email: 'mariana.costa@email.com',
      phone: '(15) 98111-2233',
      address: 'Av. Brasil, 1200 - Jardim América, Sorocaba/SP',
      isActive: true,
      financialStatus: FinancialStatus.PENDING,
      paymentMethod: 'Pix',
    },
  });

  const guardianBob = await prisma.guardian.create({
    data: {
      name: 'Roberto Alves Silveira',
      cpf: '345.678.901-23',
      email: 'roberto.alves@email.com',
      phone: '(15) 97222-3344',
      address: 'Rua Sete de Setembro, 310 - Centro, Sorocaba/SP',
      isActive: true,
      financialStatus: FinancialStatus.PAID,
      paymentMethod: 'Cartão de Crédito',
    },
  });

  const guardianLuna = await prisma.guardian.create({
    data: {
      name: 'Juliana Martins Prado',
      cpf: '456.789.012-34',
      email: 'juliana.martins@email.com',
      phone: '(15) 96333-4455',
      address: 'Rua Santa Clara, 88 - Mangal, Sorocaba/SP',
      isActive: true,
      financialStatus: FinancialStatus.PAID,
      paymentMethod: 'Pix',
    },
  });

  const guardianMax = await prisma.guardian.create({
    data: {
      name: 'Fernando Rocha Lima',
      cpf: '567.890.123-45',
      email: 'fernando.rocha@email.com',
      phone: '(15) 95444-5566',
      address: 'Av. General Carneiro, 950 - Cerrado, Sorocaba/SP',
      isActive: true,
      financialStatus: FinancialStatus.PAID,
      paymentMethod: 'Cartão de Débito',
    },
  });

  // 6. Pacientes com datas de nascimento, tipo sanguíneo e alertas
  console.log('🐾 Criando pacientes...');
  const patientThor = await prisma.patient.create({
    data: {
      guardianId: guardianThor.id,
      name: 'Thor',
      species: 'Canina',
      breed: 'Golden Retriever',
      sex: PatientSex.MALE,
      weightKg: 32.5,
      birthDate: new Date('2022-04-10'),
      bloodType: 'DEA 1.1+',
      allergies: 'Alérgico a Dipirona e Sulfas',
      treatments: ['Dermatite atópica'],
      isFasting: true,
      isCastrated: true,
      behaviorNotes: 'Dócil, porém assustado com manipulação de patas traseiras',
    },
  });

  const patientMel = await prisma.patient.create({
    data: {
      guardianId: guardianMel.id,
      name: 'Mel',
      species: 'Felina',
      breed: 'Siamês',
      sex: PatientSex.FEMALE,
      weightKg: 4.2,
      birthDate: new Date('2024-03-15'),
      bloodType: 'Tipo A',
      allergies: null,
      treatments: ['Controle glicêmico'],
      isFasting: false,
      isCastrated: true,
      behaviorNotes: 'Reativa à contenção forçada, manipular preferencialmente com toalha macia',
    },
  });

  const patientBob = await prisma.patient.create({
    data: {
      guardianId: guardianBob.id,
      name: 'Bob',
      species: 'Canina',
      breed: 'Labrador Retriever',
      sex: PatientSex.MALE,
      weightKg: 29.0,
      birthDate: new Date('2020-11-20'),
      bloodType: 'DEA 1.1-',
      allergies: 'Penicilina e derivados',
      treatments: ['Fisioterapia pós-TPLO'],
      isFasting: true,
      isCastrated: false,
      behaviorNotes: 'Muito dócil e cooperativo, aceita medicação em sachê com facilidade',
    },
  });

  const patientLuna = await prisma.patient.create({
    data: {
      guardianId: guardianLuna.id,
      name: 'Luna',
      species: 'Felina',
      breed: 'Persa',
      sex: PatientSex.FEMALE,
      weightKg: 3.6,
      birthDate: new Date('2025-06-01'),
      bloodType: 'Tipo B',
      allergies: null,
      treatments: [],
      isFasting: false,
      isCastrated: true,
      behaviorNotes: 'Calma e tímida, assusta-se com barulhos altos ou movimentos bruscos',
    },
  });

  const patientMax = await prisma.patient.create({
    data: {
      guardianId: guardianMax.id,
      name: 'Max',
      species: 'Canina',
      breed: 'Poodle Toy',
      sex: PatientSex.MALE,
      weightKg: 6.2,
      birthDate: new Date('2021-08-14'),
      bloodType: 'DEA 1.2+',
      allergies: null,
      treatments: [],
      isFasting: false,
      isCastrated: true,
      behaviorNotes: 'Muito ativo e alerta',
    },
  });

  const patientPipoca = await prisma.patient.create({
    data: {
      guardianId: guardianMax.id,
      name: 'Pipoca',
      species: 'Canina',
      breed: 'Beagle',
      sex: PatientSex.FEMALE,
      weightKg: 12.0,
      birthDate: new Date('2023-01-20'),
      bloodType: 'DEA 1.1+',
      allergies: null,
      treatments: [],
      isFasting: false,
      isCastrated: true,
    },
  });

  // 7. Internações Hospitalares
  // ATENÇÃO: As internações ativas são criadas SEM tag vinculada (nfcTagId: null),
  // permitindo que o usuário teste a leitura e o vínculo com as tags físicas que possui!
  console.log('🛏️ Criando internações ativas e históricas...');
  const now = Date.now();

  // Pacientes Ativos
  const hospThor = await prisma.hospitalization.create({
    data: {
      patientId: patientThor.id,
      kennelId: kennels[0].id, // Baia 01 - UTI Canina
      admissionReason: 'Gastroenterite hemorrágica e desidratação moderada',
      status: HospitalizationStatus.ACTIVE,
      admissionDate: new Date(now - 4 * 60 * 60 * 1000), // 4 horas atrás (Hoje)
      nfcTagId: null, // Pronto para escanear tag física!
    },
  });

  const hospMel = await prisma.hospitalization.create({
    data: {
      patientId: patientMel.id,
      kennelId: kennels[2].id, // Baia 03 - Gatil Especial
      admissionReason: 'Obstrução uretral aguda e cistite idiopática',
      status: HospitalizationStatus.ACTIVE,
      admissionDate: new Date(now - 2 * 60 * 60 * 1000), // 2 horas atrás (Hoje)
      nfcTagId: null, // Pronto para escanear tag física!
    },
  });

  const hospBob = await prisma.hospitalization.create({
    data: {
      patientId: patientBob.id,
      kennelId: kennels[1].id, // Baia 02 - Canil Médio
      admissionReason: 'Pós-operatório ortopédico de TPLO',
      status: HospitalizationStatus.ACTIVE,
      admissionDate: new Date(now - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
      nfcTagId: null, // Pronto para escanear tag física!
    },
  });

  const hospLuna = await prisma.hospitalization.create({
    data: {
      patientId: patientLuna.id,
      kennelId: kennels[3].id, // Baia 04 - Isolamento Infeccioso
      admissionReason: 'Insuficiência renal aguda e hiporexia prolongada',
      status: HospitalizationStatus.ACTIVE,
      admissionDate: new Date(now - 5 * 24 * 60 * 60 * 1000), // 5 dias atrás
      nfcTagId: null, // Pronto para escanear tag física!
    },
  });

  // Pacientes com Alta (para métricas do Resumo Temporal de Hoje, Semana e Mês)
  await prisma.hospitalization.create({
    data: {
      patientId: patientMax.id,
      kennelId: kennels[4].id, // Baia 05
      admissionReason: 'Traqueobronquite infecciosa canina',
      status: HospitalizationStatus.DISCHARGED,
      admissionDate: new Date(now - 2 * 24 * 60 * 60 * 1000),
      dischargeDate: new Date(now - 1 * 60 * 60 * 1000), // Alta há 1 hora (Hoje!)
      nfcTagId: null,
    },
  });

  await prisma.hospitalization.create({
    data: {
      patientId: patientPipoca.id,
      kennelId: kennels[5].id, // Baia 06
      admissionReason: 'Gastroenterite alimentar simples pós-indigestão',
      status: HospitalizationStatus.DISCHARGED,
      admissionDate: new Date(now - 6 * 24 * 60 * 60 * 1000),
      dischargeDate: new Date(now - 3 * 24 * 60 * 60 * 1000), // Alta há 3 dias (Esta Semana)
      nfcTagId: null,
    },
  });

  // 8. Prescrições Médicas e Itens com Tarefas Pendentes, Aplicadas e Atrasadas
  console.log('💊 Criando prescrições e tarefas clínicas...');

  // Prescrição do Thor (UTI)
  await prisma.prescription.create({
    data: {
      hospitalizationId: hospThor.id,
      prescribedById: vetUser.id,
      generalRecommendations:
        'Manter paciente em repouso absoluto. Hidratação intravenosa com Ringer Lactato 120 ml/h. Monitorar glicemia e temperatura a cada 4 horas.',
      isActive: true,
      items: {
        create: [
          {
            itemType: PrescriptionItemType.MEDICATION,
            title: 'Cefalotina 1g',
            dosage: '30 mg/kg (0.97 ml)',
            route: AdministrationRoute.INTRAVENOUS,
            scheduledTime: new Date(now + 30 * 60 * 1000), // Em 30 min (Pendente no horário)
            status: PrescriptionStatus.PENDING,
            instructions: 'Diluir em 20ml de SF 0.9% e infundir lentamente por 15 minutos.',
          },
          {
            itemType: PrescriptionItemType.MEDICATION,
            title: 'Tramadol 50 mg/ml',
            dosage: '3 mg/kg (1.95 ml)',
            route: AdministrationRoute.SUBCUTANEOUS,
            scheduledTime: new Date(now + 90 * 60 * 1000), // Em 1h30 (Pendente)
            status: PrescriptionStatus.PENDING,
            instructions: 'Aplicação via subcutânea na região interescapular.',
          },
          {
            itemType: PrescriptionItemType.MEDICATION,
            title: 'Omeprazol 40 mg',
            dosage: '1 mg/kg (0.8 ml)',
            route: AdministrationRoute.INTRAVENOUS,
            scheduledTime: new Date(now - 2 * 60 * 60 * 1000), // 2h atrás (Já Aplicada!)
            status: PrescriptionStatus.APPLIED,
            instructions: 'Administração IV direta lenta.',
          },
          {
            itemType: PrescriptionItemType.VITAL_CHECK,
            title: 'Aferição Completa de Sinais Vitais (FC, FR, Temp, PAS/PAD)',
            dosage: null,
            route: null,
            scheduledTime: new Date(now - 15 * 60 * 1000), // 15 min atrás (Atrasada para testar o alerta vermelho!)
            status: PrescriptionStatus.PENDING,
            instructions: 'Checar pressão arterial com doppler vascular e temperatura retal.',
          },
        ],
      },
    },
  });

  // Prescrição da Mel (Gatil)
  await prisma.prescription.create({
    data: {
      hospitalizationId: hospMel.id,
      prescribedById: vetUser.id,
      generalRecommendations:
        'Controle álgico intensivo. Acompanhar débito urinário na bolsa coletora e aspecto da urina.',
      isActive: true,
      items: {
        create: [
          {
            itemType: PrescriptionItemType.MEDICATION,
            title: 'Buprenorfina 0.3 mg/ml',
            dosage: '0.02 mg/kg (0.28 ml)',
            route: AdministrationRoute.INTRAVENOUS,
            scheduledTime: new Date(now + 45 * 60 * 1000),
            status: PrescriptionStatus.PENDING,
            instructions: 'Analgesia felina - administrar via intravenosa lenta.',
          },
          {
            itemType: PrescriptionItemType.PROCEDURE,
            title: 'Higienização e Checagem do Cateter Uretral',
            dosage: null,
            route: null,
            scheduledTime: new Date(now + 120 * 60 * 1000),
            status: PrescriptionStatus.PENDING,
            instructions: 'Limpeza do meato com clorexidina aquosa 0.2%.',
          },
        ],
      },
    },
  });

  // Prescrição do Bob (Ortopedia)
  await prisma.prescription.create({
    data: {
      hospitalizationId: hospBob.id,
      prescribedById: vetUser.id,
      generalRecommendations: 'Crioterapia no joelho operado a cada 6h por 15 minutos.',
      isActive: true,
      items: {
        create: [
          {
            itemType: PrescriptionItemType.MEDICATION,
            title: 'Meloxicam 2 mg/ml',
            dosage: '0.1 mg/kg (1.45 ml)',
            route: AdministrationRoute.SUBCUTANEOUS,
            scheduledTime: new Date(now + 60 * 60 * 1000),
            status: PrescriptionStatus.PENDING,
            instructions: 'Anti-inflamatório não esteroidal pós-operatório.',
          },
        ],
      },
    },
  });

  // 9. Eventos Clínicos e Linha do Tempo (Timeline)
  console.log('⏱️ Criando eventos clínicos e histórico de sinais vitais...');

  // Eventos para Thor
  await prisma.clinicalEvent.create({
    data: {
      hospitalizationId: hospThor.id,
      userId: vetUser.id,
      eventType: EventType.VITAL_SIGNS,
      title: 'Aferição de Sinais Vitais - Estável',
      description:
        'Paciente alerta e calmo na baia. Mucosas normocoradas, turgor cutâneo recuperado. Sem sinais de dor abdominal à palpação profunda.',
      metrics: {
        heartRate: 115,
        respiratoryRate: 22,
        temperature: 38.6,
        systolicBP: 122,
        diastolicBP: 76,
        meanBP: 91,
        bloodGlucose: 95,
        capillaryRefillTime: '< 2s',
      },
      recordedAt: new Date(now - 25 * 60 * 1000), // há 25 min (Última aferição exibida no Prontuário Rápido!)
    },
  });

  await prisma.clinicalEvent.create({
    data: {
      hospitalizationId: hospThor.id,
      userId: vetUser.id,
      eventType: EventType.MEDICATION_APPLICATION,
      title: 'Aplicação de Omeprazol 40 mg (IV)',
      description: 'Medicamento protetor gástrico administrado sem intercorrências.',
      recordedAt: new Date(now - 2 * 60 * 60 * 1000),
    },
  });

  await prisma.clinicalEvent.create({
    data: {
      hospitalizationId: hospThor.id,
      userId: recUser.id,
      eventType: EventType.FEEDING,
      title: 'Instituição de Jejum Clínico',
      description: 'Paciente colocado em jejum alimentar estrito para ultrassonografia abdominal.',
      recordedAt: new Date(now - 3 * 60 * 60 * 1000),
    },
  });

  await prisma.clinicalEvent.create({
    data: {
      hospitalizationId: hospThor.id,
      userId: vetUser.id,
      eventType: EventType.OBSERVATION,
      title: 'Admissão na UTI Canina',
      description: 'Entrada na Baia 01. Acesso venoso cefálico pérvio e fluidoterapia iniciada.',
      recordedAt: new Date(now - 4 * 60 * 60 * 1000),
    },
  });

  // Eventos para Mel
  await prisma.clinicalEvent.create({
    data: {
      hospitalizationId: hospMel.id,
      userId: vetUser.id,
      eventType: EventType.VITAL_SIGNS,
      title: 'Sinais Vitais e Monitorização Pós-Desobstrução',
      description: 'Paciente acordada da sedação, normotérmica e confortável.',
      metrics: {
        heartRate: 165,
        respiratoryRate: 28,
        temperature: 38.3,
        systolicBP: 128,
        capillaryRefillTime: '< 2s',
      },
      recordedAt: new Date(now - 40 * 60 * 1000),
    },
  });

  await prisma.clinicalEvent.create({
    data: {
      hospitalizationId: hospMel.id,
      userId: vetUser.id,
      eventType: EventType.PROCEDURE,
      title: 'Desobstrução Uretral e Sondagem de Demora',
      description: 'Sonda TomCat introduzida com lavagem vesical abundante de soro fisiológico.',
      recordedAt: new Date(now - 90 * 60 * 1000),
    },
  });

  // Eventos para Bob
  await prisma.clinicalEvent.create({
    data: {
      hospitalizationId: hospBob.id,
      userId: vetUser.id,
      eventType: EventType.VITAL_SIGNS,
      title: 'Aferição Matinal de Rotina',
      description: 'Paciente se alimentou espontaneamente de ração úmida. Membro com apoio parcial.',
      metrics: {
        heartRate: 98,
        respiratoryRate: 20,
        temperature: 38.5,
        systolicBP: 120,
      },
      recordedAt: new Date(now - 60 * 60 * 1000),
    },
  });

  console.log('✅ Seed de desenvolvimento finalizado com sucesso!');
  console.log('=====================================================');
  console.log('🔑 Credenciais de Acesso Rápido:');
  console.log(`- Veterinária: ${vetUser.email} / vet12345 (Dra. Madalena)`);
  console.log(`- Administrador: ${adminUser.email} / admin123`);
  console.log(`- Recepção: ${recUser.email} / rec12345`);
  console.log('-----------------------------------------------------');
  console.log('🐾 Pacientes Internados Disponíveis para Vínculo NFC:');
  console.log(`1. ${patientThor.name} (${patientThor.species} - Golden Retriever) -> Baia: ${kennels[0].name}`);
  console.log(`2. ${patientMel.name} (${patientMel.species} - Siamês) -> Baia: ${kennels[2].name}`);
  console.log(`3. ${patientBob.name} (${patientBob.species} - Labrador) -> Baia: ${kennels[1].name}`);
  console.log(`4. ${patientLuna.name} (${patientLuna.species} - Persa) -> Baia: ${kennels[3].name}`);
  console.log('💡 DICA: As coleiras começam sem tag vinculada para você escanear suas tags físicas no celular!');
  console.log('=====================================================');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a execução do seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
