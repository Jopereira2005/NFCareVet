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
  // 1. Verificação de ambiente: O seed deve rodar em desenvolvimento ou quando ALLOW_DEMO_SEED=true
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_DEMO_SEED !== 'true'
  ) {
    console.warn(
      '⚠️ [AVISO DE SEGURANÇA] O script de seed do NFCareVet é permitido apenas em desenvolvimento ou com ALLOW_DEMO_SEED="true". A execução foi cancelada.',
    );
    return;
  }

  console.log('🌱 Iniciando seed do NFCareVet...');

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

  // Helpers de data/hora que garantem consistência nos filtros "Hoje", "Semana" e "Mês"
  // mesmo quando o seed é executado perto da meia-noite (ex: 00:30).
  const nowDate = new Date();
  const now = nowDate.getTime();
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  const startOfToday = new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate(),
    0,
    0,
    0,
    0,
  ).getTime();

  /**
   * Retorna uma data "hoje" há `minutesAgo` minutos atrás, mas nunca antes das 00:02 de hoje
   * para garantir que as contagens do período "Hoje" (admissões e altas do dia) sempre funcionem.
   */
  const todayAgo = (minutesAgo: number): Date => {
    const target = now - minutesAgo * MINUTE;
    const minToday = Math.min(now - MINUTE, startOfToday + 2 * MINUTE);
    return new Date(Math.max(target, minToday));
  };

  const minutesAgo = (mins: number): Date => new Date(now - mins * MINUTE);
  const minutesFromNow = (mins: number): Date => new Date(now + mins * MINUTE);
  const daysAgo = (days: number, hoursOffset = 0): Date =>
    new Date(now - days * DAY - hoursOffset * HOUR);

  // 3. Usuários do Sistema (Equipe Multiprofissional + Crachás NFC)
  console.log('👤 Criando usuários e equipe clínica...');
  const defaultPasswordHash = await bcrypt.hash('admin123', 10);
  const vetPasswordHash = await bcrypt.hash('vet12345', 10);
  const recPasswordHash = await bcrypt.hash('rec12345', 10);
  const defaultPinHash = await bcrypt.hash('1234', 10);

  // Admin (BADGE001 coincide com o crachá simulado BA:DG:E0:01 da tela de login no desktop)
  const adminUser = await prisma.user.create({
    data: {
      name: 'Dra. Camila Andrade (Admin)',
      email: 'admin@nfcarevet.com',
      passwordHash: defaultPasswordHash,
      pinHash: defaultPinHash,
      role: UserRole.ADMIN,
      badgeUid: 'BADGE001',
      avatarUrl:
        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&h=256&q=80',
      active: true,
    },
  });

  // Veterinária principal (Login rápido 1-clique no frontend-teste)
  const vetUser = await prisma.user.create({
    data: {
      name: 'Dra. Madalena Silva',
      email: 'madalena@nfcarevet.com',
      passwordHash: vetPasswordHash,
      pinHash: defaultPinHash,
      role: UserRole.VET,
      badgeUid: 'BADGE002',
      avatarUrl:
        'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=256&h=256&q=80',
      active: true,
    },
  });

  // Veterinário "Mr Paxe" (Coincide com o filtro rápido de busca "Dr: Mr Paxe" na aba Atividades Gerais)
  const vetPaxe = await prisma.user.create({
    data: {
      name: 'Dr. Marcos Paxe (Mr Paxe)',
      email: 'paxe@nfcarevet.com',
      passwordHash: vetPasswordHash,
      pinHash: defaultPinHash,
      role: UserRole.VET,
      badgeUid: 'BADGE004',
      avatarUrl:
        'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=256&h=256&q=80',
      active: true,
    },
  });

  // Veterinário Cirurgião / Ortopedista
  const vetRafael = await prisma.user.create({
    data: {
      name: 'Dr. Rafael Mendes',
      email: 'rafael@nfcarevet.com',
      passwordHash: vetPasswordHash,
      pinHash: defaultPinHash,
      role: UserRole.VET,
      badgeUid: 'BADGE005',
      avatarUrl:
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&h=256&q=80',
      active: true,
    },
  });

  // Recepção / Apoio Clínico Diurno
  const recUser = await prisma.user.create({
    data: {
      name: 'Carlos Recepção',
      email: 'recepcao@nfcarevet.com',
      passwordHash: recPasswordHash,
      pinHash: defaultPinHash,
      role: UserRole.REC,
      badgeUid: 'BADGE003',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
      active: true,
    },
  });

  // Recepção / Enfermagem Auxiliar Noturna
  const recFernanda = await prisma.user.create({
    data: {
      name: 'Fernanda Oliveira',
      email: 'fernanda@nfcarevet.com',
      passwordHash: recPasswordHash,
      pinHash: defaultPinHash,
      role: UserRole.REC,
      badgeUid: 'BADGE006',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      active: true,
    },
  });

  // Usuário Inativo para testar bloqueio de autenticação (403 Forbidden)
  await prisma.user.create({
    data: {
      name: 'Dr. Henrique Costa (Inativo)',
      email: 'inativo@nfcarevet.com',
      passwordHash: vetPasswordHash,
      pinHash: defaultPinHash,
      role: UserRole.VET,
      badgeUid: 'BADGE999',
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
      active: false,
    },
  });

  // 4. Baias / Leitos (Kennels) - 11 baias ativas + 1 baia em manutenção
  // (8 ocupadas + 3 livres para testar novas admissões e transferências de leito)
  console.log('🏥 Criando baias e leitos hospitalares...');
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
        notes: 'Ambiente climatizado, silencioso com difusor de feromônio facial felino',
        isActive: true,
      },
    }),
    prisma.kennel.create({
      data: {
        name: 'Baia 04 - Isolamento Infeccioso',
        notes: 'Pressão negativa, exaustão dedicada e antessala de paramentação',
        isActive: true,
      },
    }),
    prisma.kennel.create({
      data: {
        name: 'Baia 05 - Canil Grande',
        notes: 'Espaço amplo reforçado para cães de grande e gigante porte',
        isActive: true,
      },
    }),
    prisma.kennel.create({
      data: {
        name: 'Baia 06 - Canil Pequeno',
        notes: 'Baia aquecida com controle de umidade para braquicefálicos e filhotes',
        isActive: true,
      },
    }),
    prisma.kennel.create({
      data: {
        name: 'Baia 07 - Gatil 02',
        notes: 'Gatil verticalizado com prateleiras acolchoadas e iluminação dimerizável',
        isActive: true,
      },
    }),
    prisma.kennel.create({
      data: {
        name: 'Baia 08 - Semi-Intensiva',
        notes: 'Suporte para oxigenoterapia, fluidoterapia e observação neurológica',
        isActive: true,
      },
    }),
    prisma.kennel.create({
      data: {
        name: 'Baia 09 - Recuperação Pós-Cirúrgica',
        notes: 'Leito livre com aquecimento infravermelho para recuperação anestésica',
        isActive: true,
      },
    }),
    prisma.kennel.create({
      data: {
        name: 'Baia 10 - Gatil Silencioso 03',
        notes: 'Leito felino livre com isolamento acústico',
        isActive: true,
      },
    }),
    prisma.kennel.create({
      data: {
        name: 'Baia 11 - Canil Ortopédico 02',
        notes: 'Leito livre com piso antiderrapante emborrachado',
        isActive: true,
      },
    }),
    prisma.kennel.create({
      data: {
        name: 'Baia 12 - Isolamento 02 (Manutenção)',
        notes: 'Em higienização terminal e calibração de rede de gases',
        isActive: false,
      },
    }),
  ]);

  // 5. Inventário de Tags NFC (Coleiras Inteligentes)
  // - 3 tags vinculadas a pacientes internados (incluindo 04A1B2C3D48831 usada na simulação desktop de consulta)
  // - 7 tags livres no inventário para testes e métricas do painel
  // - 1 tag inativa para teste de validação de inventário
  // - NOTA: 5 pacientes internados permanecem com nfcTagId: null para permitir vínculo imediato de tags físicas!
  console.log('🏷️ Criando inventário de tags e coleiras NFC...');
  const tagThor = await prisma.nfcTag.create({
    data: {
      tagUid: '04A1B2C3D48831', // Coincide com SIMULATED_TAG_SERIAL.consult no Reader.tsx
      publicCode: 'VET-8831',
      active: true,
    },
  });

  const tagApollo = await prisma.nfcTag.create({
    data: {
      tagUid: '04A1B2C3D48832',
      publicCode: 'VET-8832',
      active: true,
    },
  });

  const tagSimba = await prisma.nfcTag.create({
    data: {
      tagUid: '04A1B2C3D48833',
      publicCode: 'VET-8833',
      active: true,
    },
  });

  // Tags livres no inventário (disponíveis para vínculo)
  await Promise.all([
    prisma.nfcTag.create({
      data: { tagUid: '04B2C3D4E59001', publicCode: 'VET-9001', active: true },
    }),
    prisma.nfcTag.create({
      data: { tagUid: '04B2C3D4E59002', publicCode: 'VET-9002', active: true },
    }),
    prisma.nfcTag.create({
      data: { tagUid: '04B2C3D4E59003', publicCode: 'VET-9003', active: true },
    }),
    prisma.nfcTag.create({
      data: { tagUid: '04B2C3D4E59004', publicCode: 'VET-9004', active: true },
    }),
    prisma.nfcTag.create({
      data: { tagUid: '04B2C3D4E59005', publicCode: 'VET-9005', active: true },
    }),
    prisma.nfcTag.create({
      data: { tagUid: '04B2C3D4E59006', publicCode: 'VET-9006', active: true },
    }),
    prisma.nfcTag.create({
      data: { tagUid: '04B2C3D4E59007', publicCode: 'VET-9007', active: true },
    }),
    // Tag inativa para testar bloqueio de vínculo
    prisma.nfcTag.create({
      data: { tagUid: '04DEAD00009999', publicCode: 'VET-9999', active: false },
    }),
  ]);

  // 6. Tutores (Guardians) - 9 Tutores com diferentes status financeiros e formas de pagamento
  console.log('👨‍👩‍👧 Criando tutores...');

  // Coincide com a sugestão de busca rápida "Lucas Silva" em Busca e Histórico
  const guardianLucas = await prisma.guardian.create({
    data: {
      name: 'Lucas Silva de Oliveira',
      cpf: '123.456.789-01',
      email: 'lucas.silva@email.com',
      phone: '(15) 99123-4567',
      address: 'Rua das Palmeiras, 450 - Apto 82, Campolim - Sorocaba/SP',
      photoUrl:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&h=300&q=80',
      isActive: true,
      financialStatus: FinancialStatus.PAID,
      paymentMethod: 'Boleto',
      createdAt: daysAgo(12),
    },
  });

  const guardianMariana = await prisma.guardian.create({
    data: {
      name: 'Mariana Costa Ferreira',
      cpf: '234.567.890-12',
      email: 'mariana.costa@email.com',
      phone: '(15) 98111-2233',
      address: 'Av. Brasil, 1200 - Jardim América, Sorocaba/SP',
      photoUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&h=300&q=80',
      isActive: true,
      financialStatus: FinancialStatus.PENDING,
      paymentMethod: 'Pix',
      createdAt: todayAgo(95),
    },
  });

  const guardianRoberto = await prisma.guardian.create({
    data: {
      name: 'Roberto Alves Silveira',
      cpf: '345.678.901-23',
      email: 'roberto.alves@email.com',
      phone: '(15) 97222-3344',
      address: 'Rua Sete de Setembro, 310 - Centro, Sorocaba/SP',
      photoUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&h=300&q=80',
      isActive: true,
      financialStatus: FinancialStatus.PAID,
      paymentMethod: 'Cartão de Crédito',
      createdAt: daysAgo(30),
    },
  });

  const guardianJuliana = await prisma.guardian.create({
    data: {
      name: 'Juliana Martins Prado',
      cpf: '456.789.012-34',
      email: 'juliana.martins@email.com',
      phone: '(15) 96333-4455',
      address: 'Rua Santa Clara, 88 - Mangal, Sorocaba/SP',
      photoUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300&q=80',
      isActive: true,
      financialStatus: FinancialStatus.OVERDUE,
      paymentMethod: 'Boleto',
      createdAt: daysAgo(18),
    },
  });

  const guardianFernando = await prisma.guardian.create({
    data: {
      name: 'Fernando Rocha Lima',
      cpf: '567.890.123-45',
      email: 'fernando.rocha@email.com',
      phone: '(15) 95444-5566',
      address: 'Av. General Carneiro, 950 - Cerrado, Sorocaba/SP',
      photoUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300&q=80',
      isActive: true,
      financialStatus: FinancialStatus.PAID,
      paymentMethod: 'Cartão de Débito',
      createdAt: daysAgo(25),
    },
  });

  const guardianCarlos = await prisma.guardian.create({
    data: {
      name: 'Carlos Eduardo Santos',
      cpf: '678.901.234-56',
      email: 'carlos.santos@email.com',
      phone: '(15) 99234-5678',
      address: 'Alameda dos Ipês, 210 - Condomínio Ibiti Royal, Sorocaba/SP',
      photoUrl:
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&h=300&q=80',
      isActive: true,
      financialStatus: FinancialStatus.PAID,
      paymentMethod: 'Cartão de Crédito',
      createdAt: daysAgo(7),
    },
  });

  const guardianBeatriz = await prisma.guardian.create({
    data: {
      name: 'Beatriz Nogueira Campos',
      cpf: '789.012.345-67',
      email: 'beatriz.nogueira@email.com',
      phone: '(15) 98877-6655',
      address: 'Rua Aparecida, 640 - Santa Rosália, Sorocaba/SP',
      photoUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&h=300&q=80',
      isActive: true,
      financialStatus: FinancialStatus.PENDING,
      paymentMethod: 'Pix',
      createdAt: daysAgo(3),
    },
  });

  const guardianGabriel = await prisma.guardian.create({
    data: {
      name: 'Gabriel Henrique Souza',
      cpf: '890.123.456-78',
      email: 'gabriel.souza@email.com',
      phone: '(15) 99765-4321',
      address: 'Av. Professora Izoraida Marques Peres, 800 - Campolim, Sorocaba/SP',
      photoUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300&q=80',
      isActive: true,
      financialStatus: FinancialStatus.PAID,
      paymentMethod: 'Pix',
      createdAt: todayAgo(25), // Recém-cadastrado para aparecer em "Cadastros Recentes" na Home
    },
  });

  const guardianPatricia = await prisma.guardian.create({
    data: {
      name: 'Patrícia Gomes de Almeida',
      cpf: '901.234.567-89',
      email: 'patricia.gomes@email.com',
      phone: '(15) 99654-3210',
      address: 'Rua Barão de Tatuí, 512 - Vergueiro, Sorocaba/SP',
      photoUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&h=300&q=80',
      isActive: true,
      financialStatus: FinancialStatus.OVERDUE,
      paymentMethod: 'Cartão de Crédito',
      createdAt: daysAgo(14),
    },
  });

  // 7. Pacientes (16 pets com perfis clínicos completos, alergias, tipos sanguíneos e notas)
  console.log('🐾 Criando pacientes...');

  const patientThor = await prisma.patient.create({
    data: {
      guardianId: guardianLucas.id,
      name: 'Thor',
      species: 'Canina',
      breed: 'Golden Retriever',
      sex: PatientSex.MALE,
      weightKg: 32.5,
      photoUrl:
        'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=500&h=500&q=80',
      birthDate: new Date('2022-04-10'),
      bloodType: 'DEA 1.1+',
      allergies: 'Alérgico a Dipirona e Sulfas',
      treatments: ['Dermatite atópica', 'Gastroenterite hemorrágica'],
      isFasting: true,
      isCastrated: true,
      behaviorNotes: 'Dócil e obediente, porém assustado com manipulação de membros pélvicos',
      createdAt: daysAgo(10),
    },
  });

  const patientBidu = await prisma.patient.create({
    data: {
      guardianId: guardianLucas.id,
      name: 'Bidu',
      species: 'Canina',
      breed: 'Shih-tzu',
      sex: PatientSex.MALE,
      weightKg: 6.1,
      photoUrl:
        'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=500&h=500&q=80',
      birthDate: new Date('2019-07-22'),
      bloodType: 'DEA 1.1-',
      allergies: null,
      treatments: ['Ceratoconjuntivite seca (Tacrolimus colírio)'],
      isFasting: false,
      isCastrated: true,
      behaviorNotes: 'Agitado durante coleta de sangue e limpeza auricular',
      createdAt: daysAgo(8),
    },
  });

  const patientMel = await prisma.patient.create({
    data: {
      guardianId: guardianMariana.id,
      name: 'Mel',
      species: 'Felina',
      breed: 'Siamês',
      sex: PatientSex.FEMALE,
      weightKg: 4.2,
      photoUrl:
        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=500&h=500&q=80',
      birthDate: new Date('2024-03-15'),
      bloodType: 'Tipo A',
      allergies: 'Cefalexina',
      treatments: ['Controle glicêmico', 'Desobstrução uretral'],
      isFasting: false,
      isCastrated: true,
      behaviorNotes: 'Reativa à contenção forçada, manipular preferencialmente com toalha macia e Feliway',
      createdAt: daysAgo(5),
    },
  });

  const patientBob = await prisma.patient.create({
    data: {
      guardianId: guardianRoberto.id,
      name: 'Bob',
      species: 'Canina',
      breed: 'Labrador Retriever',
      sex: PatientSex.MALE,
      weightKg: 29.0,
      photoUrl:
        'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=500&h=500&q=80',
      birthDate: new Date('2020-11-20'),
      bloodType: 'DEA 1.1-',
      allergies: 'Penicilina e derivados beta-lactâmicos',
      treatments: ['Fisioterapia pós-TPLO', 'Condroprotetores'],
      isFasting: true,
      isCastrated: false,
      behaviorNotes: 'Muito dócil e cooperativo, aceita medicação oral em sachê com facilidade',
      createdAt: daysAgo(20),
    },
  });

  const patientZeca = await prisma.patient.create({
    data: {
      guardianId: guardianRoberto.id,
      name: 'Zeca',
      species: 'Canina',
      breed: 'Boxer',
      sex: PatientSex.MALE,
      weightKg: 31.2,
      photoUrl:
        'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=500&h=500&q=80',
      birthDate: new Date('2018-05-03'),
      bloodType: 'DEA 1.1+',
      allergies: 'AINEs (Meloxicam / Carprofeno)',
      treatments: ['Monitoramento cardiológico semestral'],
      isFasting: false,
      isCastrated: true,
      behaviorNotes: 'Calmo e sociável com a equipe',
      createdAt: daysAgo(15),
    },
  });

  const patientLuna = await prisma.patient.create({
    data: {
      guardianId: guardianJuliana.id,
      name: 'Luna',
      species: 'Felina',
      breed: 'Persa',
      sex: PatientSex.FEMALE,
      weightKg: 3.6,
      photoUrl:
        'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=500&h=500&q=80',
      birthDate: new Date('2023-06-01'),
      bloodType: 'Tipo B',
      allergies: null,
      treatments: ['Fluidoterapia nefropatia aguda', 'Suporte nutricional'],
      isFasting: false,
      isCastrated: true,
      behaviorNotes: 'Calma e tímida, assusta-se com barulhos altos ou movimentos bruscos',
      createdAt: daysAgo(6),
    },
  });

  const patientMax = await prisma.patient.create({
    data: {
      guardianId: guardianFernando.id,
      name: 'Max',
      species: 'Canina',
      breed: 'Poodle Toy',
      sex: PatientSex.MALE,
      weightKg: 6.2,
      photoUrl:
        'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=500&h=500&q=80',
      birthDate: new Date('2021-08-14'),
      bloodType: 'DEA 1.2+',
      allergies: null,
      treatments: ['Nebulização pós-alta'],
      isFasting: false,
      isCastrated: true,
      behaviorNotes: 'Muito ativo, vocaliza quando fica sozinho na baia',
      createdAt: daysAgo(4),
    },
  });

  const patientPipoca = await prisma.patient.create({
    data: {
      guardianId: guardianFernando.id,
      name: 'Pipoca',
      species: 'Canina',
      breed: 'Beagle',
      sex: PatientSex.FEMALE,
      weightKg: 12.0,
      photoUrl:
        'https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&w=500&h=500&q=80',
      birthDate: new Date('2023-01-20'),
      bloodType: 'DEA 1.1+',
      allergies: 'Proteína de frango (dieta hipoalergênica)',
      treatments: ['Probiótico veterinário'],
      isFasting: false,
      isCastrated: true,
      behaviorNotes: 'Extremamente dócil e curiosa',
      createdAt: daysAgo(7),
    },
  });

  const patientApollo = await prisma.patient.create({
    data: {
      guardianId: guardianCarlos.id,
      name: 'Apollo',
      species: 'Canina',
      breed: 'Pastor Alemão',
      sex: PatientSex.MALE,
      weightKg: 38.4,
      photoUrl:
        'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=500&h=500&q=80',
      birthDate: new Date('2020-02-11'),
      bloodType: 'DEA 1.1+',
      allergies: null,
      treatments: ['Pós-operatório de Gastropexia (DVG)', 'Monitoramento de arritmias (ECG)'],
      isFasting: true,
      isCastrated: false,
      behaviorNotes: 'Protetor e desconfiado, requer aproximação tranquila e uso preventivo de focinheira no manejo álgico',
      createdAt: daysAgo(2),
    },
  });

  const patientAmora = await prisma.patient.create({
    data: {
      guardianId: guardianBeatriz.id,
      name: 'Amora',
      species: 'Canina',
      breed: 'Bulldog Francês',
      sex: PatientSex.FEMALE,
      weightKg: 11.2,
      photoUrl:
        'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?auto=format&fit=crop&w=500&h=500&q=80',
      birthDate: new Date('2023-09-08'),
      bloodType: 'DEA 1.1-',
      allergies: 'Picada de insetos e contraste iodado',
      treatments: ['Oxigenoterapia', 'Controle de edema de glote'],
      isFasting: false,
      isCastrated: true,
      behaviorNotes: 'Braquicefálica — evitar estresse térmico e contenção cervical sob qualquer hipótese',
      createdAt: daysAgo(2),
    },
  });

  const patientMia = await prisma.patient.create({
    data: {
      guardianId: guardianBeatriz.id,
      name: 'Mia',
      species: 'Felina',
      breed: 'Ragdoll',
      sex: PatientSex.FEMALE,
      weightKg: 4.9,
      photoUrl:
        'https://images.unsplash.com/photo-1513360309081-38f07627399e?auto=format&fit=crop&w=500&h=500&q=80',
      birthDate: new Date('2022-12-03'),
      bloodType: 'Tipo AB',
      allergies: null,
      treatments: ['Escovação diária e pasta de malte'],
      isFasting: false,
      isCastrated: true,
      behaviorNotes: 'Extremamente mansa, permite coleta e exames sem contenção',
      createdAt: daysAgo(19),
    },
  });

  const patientSimba = await prisma.patient.create({
    data: {
      guardianId: guardianGabriel.id,
      name: 'Simba',
      species: 'Felina',
      breed: 'Maine Coon',
      sex: PatientSex.MALE,
      weightKg: 7.8,
      photoUrl:
        'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=500&h=500&q=80',
      birthDate: new Date('2021-05-19'),
      bloodType: 'Tipo A',
      allergies: 'Quetamina (histórico de taquicardia severa)',
      treatments: ['Cardiomiopatia Hipertrófica (Atenolol + Clopidogrel)'],
      isFasting: false,
      isCastrated: true,
      behaviorNotes: 'Gato de grande porte, cooperativo mas sensível a manipulação torácica demorada',
      createdAt: daysAgo(3),
    },
  });

  const patientKoda = await prisma.patient.create({
    data: {
      guardianId: guardianGabriel.id,
      name: 'Koda',
      species: 'Canina',
      breed: 'Husky Siberiano',
      sex: PatientSex.MALE,
      weightKg: 26.5,
      photoUrl:
        'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?auto=format&fit=crop&w=500&h=500&q=80',
      birthDate: new Date('2024-01-12'),
      bloodType: 'DEA 1.1+',
      allergies: null,
      treatments: [],
      isFasting: false,
      isCastrated: false,
      behaviorNotes: 'Muito vocal e energético, ótimo para testar nova admissão hospitalar',
      createdAt: todayAgo(15), // Recém-cadastrado (aparece em Cadastros Recentes na Home)
    },
  });

  const patientFrida = await prisma.patient.create({
    data: {
      guardianId: guardianPatricia.id,
      name: 'Frida',
      species: 'Canina',
      breed: 'Dachshund',
      sex: PatientSex.FEMALE,
      weightKg: 8.5,
      photoUrl:
        'https://images.unsplash.com/photo-1612195583950-b8fd34c87093?auto=format&fit=crop&w=500&h=500&q=80',
      birthDate: new Date('2019-10-25'),
      bloodType: 'DEA 4+',
      allergies: 'Tramadol (causa disforia e êmese)',
      treatments: ['Reabilitação neurofuncional pós-hemilaminectomia T13-L1', 'Compressão vesical programada'],
      isFasting: false,
      isCastrated: true,
      behaviorNotes: 'Manter suporte vertebral horizontal ao erguer da baia. Dócil e carinhosa.',
      createdAt: daysAgo(4),
    },
  });

  const patientCacau = await prisma.patient.create({
    data: {
      guardianId: guardianPatricia.id,
      name: 'Cacau',
      species: 'Canina',
      breed: 'Yorkshire Terrier',
      sex: PatientSex.FEMALE,
      weightKg: 2.8,
      photoUrl:
        'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?auto=format&fit=crop&w=500&h=500&q=80',
      birthDate: new Date('2025-02-10'),
      bloodType: 'DEA 1.1-',
      allergies: null,
      treatments: ['Acompanhamento de colapso de traqueia grau I'],
      isFasting: false,
      isCastrated: false,
      behaviorNotes: 'Filhote assustada, tendência a hipoglicemia se ficar em jejum prolongado',
      createdAt: todayAgo(45), // Recém-cadastrada (aparece em Cadastros Recentes na Home)
    },
  });

  const patientNina = await prisma.patient.create({
    data: {
      guardianId: guardianMariana.id,
      name: 'Nina',
      species: 'Felina',
      breed: 'SRD (Pelo Curto Brasileiro)',
      sex: PatientSex.FEMALE,
      weightKg: 3.4,
      photoUrl:
        'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=500&h=500&q=80',
      birthDate: new Date('2020-03-08'),
      bloodType: 'Tipo A',
      allergies: null,
      treatments: ['Doença Renal Crônica IRIS III'],
      isFasting: false,
      isCastrated: true,
      behaviorNotes: 'Tranquila, aceita fluidoterapia subcutânea sem resistência',
      createdAt: daysAgo(12),
    },
  });

  // 8. Internações Hospitalares (8 Ativas + 7 Históricas / Altas / Transferências)
  console.log('🛏️ Criando internações ativas e históricas...');

  // --- INTERNAÇÕES ATIVAS (8 pacientes em 8 baias) ---
  // 3 com tag NFC vinculada (Thor, Apollo, Simba) para testar Modo Consulta e Desvínculo
  // 5 sem tag NFC (Mel, Bob, Luna, Amora, Frida) para testar Modo Vínculo com tags físicas ou simuladas!

  const hospThor = await prisma.hospitalization.create({
    data: {
      patientId: patientThor.id,
      kennelId: kennels[0].id, // Baia 01 - UTI Canina
      admissionReason: 'Gastroenterite hemorrágica aguda e desidratação moderada (7%)',
      status: HospitalizationStatus.ACTIVE,
      admissionDate: todayAgo(240), // Admitido Hoje
      nfcTagId: tagThor.id, // Tag VET-8831 (04A1B2C3D48831) vinculada para simulação de consulta
    },
  });

  const hospMel = await prisma.hospitalization.create({
    data: {
      patientId: patientMel.id,
      kennelId: kennels[2].id, // Baia 03 - Gatil Especial
      admissionReason: 'Obstrução uretral aguda, cistite idiopática felina e cetoacidose leve',
      status: HospitalizationStatus.ACTIVE,
      admissionDate: todayAgo(150), // Admitida Hoje
      nfcTagId: null, // Pronta para escanear tag física!
    },
  });

  const hospApollo = await prisma.hospitalization.create({
    data: {
      patientId: patientApollo.id,
      kennelId: kennels[4].id, // Baia 05 - Canil Grande
      admissionReason: 'Pós-operatório imediato de descompressão gástrica e gastropexia (DVG)',
      status: HospitalizationStatus.ACTIVE,
      admissionDate: todayAgo(320), // Admitido Hoje
      nfcTagId: tagApollo.id, // Tag VET-8832 vinculada
    },
  });

  const hospAmora = await prisma.hospitalization.create({
    data: {
      patientId: patientAmora.id,
      kennelId: kennels[5].id, // Baia 06 - Canil Pequeno
      admissionReason: 'Crise dispneica aguda por síndrome braquicefálica e hipertermia (40.4 °C)',
      status: HospitalizationStatus.ACTIVE,
      admissionDate: daysAgo(1, 3), // Ontem (Esta Semana)
      nfcTagId: null, // Pronta para escanear tag física!
    },
  });

  const hospBob = await prisma.hospitalization.create({
    data: {
      patientId: patientBob.id,
      kennelId: kennels[1].id, // Baia 02 - Canil Médio
      admissionReason: 'Pós-operatório ortopédico de osteotomia de nivelamento do platô tibial (TPLO)',
      status: HospitalizationStatus.ACTIVE,
      admissionDate: daysAgo(2, 4), // 2 dias atrás (Esta Semana)
      nfcTagId: null, // Pronto para escanear tag física!
    },
  });

  const hospSimba = await prisma.hospitalization.create({
    data: {
      patientId: patientSimba.id,
      kennelId: kennels[6].id, // Baia 07 - Gatil 02
      admissionReason: 'Descompensação de cardiomiopatia hipertrófica e prevenção de tromboembolismo arterial',
      status: HospitalizationStatus.ACTIVE,
      admissionDate: daysAgo(3, 2), // 3 dias atrás (Esta Semana)
      nfcTagId: tagSimba.id, // Tag VET-8833 vinculada
    },
  });

  const hospFrida = await prisma.hospitalization.create({
    data: {
      patientId: patientFrida.id,
      kennelId: kennels[7].id, // Baia 08 - Semi-Intensiva
      admissionReason: 'Pós-operatório de hemilaminectomia toracolombar (DDIV Hansen tipo I)',
      status: HospitalizationStatus.ACTIVE,
      admissionDate: daysAgo(4, 1), // 4 dias atrás (Esta Semana)
      nfcTagId: null, // Pronta para escanear tag física!
    },
  });

  const hospLuna = await prisma.hospitalization.create({
    data: {
      patientId: patientLuna.id,
      kennelId: kennels[3].id, // Baia 04 - Isolamento Infeccioso
      admissionReason: 'Insuficiência renal aguda (IRA) secundária a pielonefrite e hiporexia prolongada',
      status: HospitalizationStatus.ACTIVE,
      admissionDate: daysAgo(5, 2), // 5 dias atrás (Esta Semana)
      nfcTagId: null, // Pronta para escanear tag física!
    },
  });

  // --- INTERNAÇÕES HISTÓRICAS (Altas e Transferências para alimentar Resumo Temporal e Histórico) ---

  // Alta Hoje #1 (Max)
  const hospMaxDischarged = await prisma.hospitalization.create({
    data: {
      patientId: patientMax.id,
      kennelId: kennels[8].id, // Baia 09
      admissionReason: 'Traqueobronquite infecciosa canina com tosse paroxística',
      status: HospitalizationStatus.DISCHARGED,
      admissionDate: daysAgo(2, 2),
      dischargeDate: todayAgo(50), // Alta Hoje
      nfcTagId: null,
    },
  });

  // Alta Hoje #2 (Bidu - admitido hoje de manhã para observação e recebeu alta hoje)
  const hospBiduDischarged = await prisma.hospitalization.create({
    data: {
      patientId: patientBidu.id,
      kennelId: kennels[10].id, // Baia 11
      admissionReason: 'Reação alérgica aguda (angioedema facial) pós-vacinação externa',
      status: HospitalizationStatus.DISCHARGED,
      admissionDate: todayAgo(300),
      dischargeDate: todayAgo(30), // Alta Hoje
      nfcTagId: null,
    },
  });

  // Alta Esta Semana (Pipoca)
  const hospPipocaDischarged = await prisma.hospitalization.create({
    data: {
      patientId: patientPipoca.id,
      kennelId: kennels[8].id, // Baia 09
      admissionReason: 'Gastroenterite alimentar aguda pós-indigestão',
      status: HospitalizationStatus.DISCHARGED,
      admissionDate: daysAgo(5, 4),
      dischargeDate: daysAgo(2, 6), // Alta há 2 dias (Esta Semana)
      nfcTagId: null,
    },
  });

  // Transferência Externa Esta Semana (Nina)
  const hospNinaTransferred = await prisma.hospitalization.create({
    data: {
      patientId: patientNina.id,
      kennelId: kennels[9].id, // Baia 10
      admissionReason: 'Crise urêmica aguda em paciente renal crônica — indicação de hemodiálise',
      status: HospitalizationStatus.TRANSFERRED,
      admissionDate: daysAgo(4, 5),
      dischargeDate: daysAgo(1, 4), // Transferida ontem (Esta Semana)
      nfcTagId: null,
    },
  });

  // Alta neste mês / histórico recente (Zeca)
  await prisma.hospitalization.create({
    data: {
      patientId: patientZeca.id,
      kennelId: kennels[10].id, // Baia 11
      admissionReason: 'Síncope vasovagal e ajuste de terapia antiarrítmica',
      status: HospitalizationStatus.DISCHARGED,
      admissionDate: daysAgo(12, 3),
      dischargeDate: daysAgo(9, 2),
      nfcTagId: null,
    },
  });

  // Alta histórica (Mia)
  await prisma.hospitalization.create({
    data: {
      patientId: patientMia.id,
      kennelId: kennels[9].id, // Baia 10
      admissionReason: 'Obstrução parcial por tricobezoar (bola de pelos) resolvida clinicamente',
      status: HospitalizationStatus.DISCHARGED,
      admissionDate: daysAgo(18, 2),
      dischargeDate: daysAgo(15, 5),
      nfcTagId: null,
    },
  });

  // Internação anterior antiga do Thor (para mostrar histórico de múltiplas internações no mesmo paciente)
  await prisma.hospitalization.create({
    data: {
      patientId: patientThor.id,
      kennelId: kennels[1].id,
      admissionReason: 'Otite externa bilateral severa e piodermite superficial',
      status: HospitalizationStatus.DISCHARGED,
      admissionDate: daysAgo(45, 4),
      dischargeDate: daysAgo(42, 2),
      nfcTagId: null,
    },
  });

  // 9. Prescrições Médicas e Itens (Tarefas Pendentes de Alta/Média/Baixa Prioridade, Aplicadas e Suspensas)
  console.log('💊 Criando prescrições e fila de tarefas de enfermagem...');

  // --- Prescrição 1: Thor (UTI Canina) - Prescrita por Dra. Madalena ---
  const prescThor = await prisma.prescription.create({
    data: {
      hospitalizationId: hospThor.id,
      prescribedById: vetUser.id,
      generalRecommendations:
        'Manter paciente em repouso absoluto e jejum alimentar. Hidratação IV contínua com Ringer Lactato 120 ml/h em bomba de infusão. Monitorar glicemia, TPC e temperatura retal a cada 4 horas. ATENÇÃO: Alérgico a Dipirona e Sulfas!',
      isActive: true,
      validUntil: minutesFromNow(24 * 60),
    },
  });

  const itemThorVitalOverdue = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescThor.id,
      itemType: PrescriptionItemType.VITAL_CHECK,
      title: 'Aferição Completa de Sinais Vitais (FC, FR, Temp, PAS/PAD)',
      dosage: null,
      route: null,
      scheduledTime: minutesAgo(20), // ATRASADA -> Prioridade ALTA
      status: PrescriptionStatus.PENDING,
      instructions: 'Checar pressão arterial com Doppler vascular no membro torácico esquerdo e temperatura retal.',
    },
  });

  const itemThorCefalotina = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescThor.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Cefalotina Sódica 1g',
      dosage: '30 mg/kg (9.75 ml)',
      route: AdministrationRoute.INTRAVENOUS,
      scheduledTime: minutesFromNow(25), // Em 25 min -> Prioridade MÉDIA
      status: PrescriptionStatus.PENDING,
      instructions: 'Diluir em 20ml de SF 0.9% e infundir lentamente em 15 minutos pelo acesso cefálico.',
    },
  });

  const itemThorOndansetrona = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescThor.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Ondansetrona 2 mg/ml (Antiemético)',
      dosage: '0.5 mg/kg (8.1 ml)',
      route: AdministrationRoute.INTRAVENOUS,
      scheduledTime: minutesFromNow(95), // Em 1h35 -> Prioridade BAIXA
      status: PrescriptionStatus.PENDING,
      instructions: 'Administrar IV lento ao longo de 3 a 5 minutos para controle de náusea.',
    },
  });

  const itemThorUltrassom = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescThor.id,
      itemType: PrescriptionItemType.EXAM,
      title: 'Ultrassonografia Abdominal Fast (A-FAST)',
      dosage: null,
      route: null,
      scheduledTime: minutesFromNow(150), // Em 2h30 -> Prioridade BAIXA
      status: PrescriptionStatus.PENDING,
      instructions: 'Avaliar motilidade intestinal, espessura de parede gástrica e descartar intussuscepção.',
    },
  });

  const itemThorOmeprazolApplied = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescThor.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Omeprazol Sódico 4 mg/ml',
      dosage: '1 mg/kg (8.1 ml)',
      route: AdministrationRoute.INTRAVENOUS,
      scheduledTime: minutesAgo(120),
      status: PrescriptionStatus.APPLIED,
      instructions: 'Protetor gástrico — administração IV direta lenta.',
    },
  });

  const itemThorDipironaCancelled = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescThor.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Dipirona Sódica 500 mg/ml',
      dosage: '25 mg/kg (1.6 ml)',
      route: AdministrationRoute.INTRAVENOUS,
      scheduledTime: minutesAgo(180),
      status: PrescriptionStatus.CANCELLED,
      instructions: 'Item suspenso imediatamente após revisão de alerta de alergia.',
    },
  });

  // --- Prescrição 2: Complemento do Thor prescrito pelo Dr. Marcos Paxe (Mr Paxe) ---
  await prisma.prescription.create({
    data: {
      hospitalizationId: hospThor.id,
      prescribedById: vetPaxe.id,
      generalRecommendations: 'Coleta laboratorial seriada para controle de hematócrito e proteínas plasmáticas.',
      isActive: true,
      validUntil: minutesFromNow(12 * 60),
      items: {
        create: [
          {
            itemType: PrescriptionItemType.EXAM,
            title: 'Coleta de Sangue (Hemograma + Lactato Sérico)',
            dosage: null,
            route: null,
            scheduledTime: minutesAgo(35), // ATRASADA -> Prioridade ALTA (Prescrita por Mr Paxe!)
            status: PrescriptionStatus.PENDING,
            instructions: 'Coletar 2ml em tubo EDTA (tampa roxa) e 1ml em fluoreto pela jugular.',
          },
          {
            itemType: PrescriptionItemType.MEDICATION,
            title: 'Citrato de Maropitant (Cerenia) 10 mg/ml',
            dosage: '1 mg/kg (3.25 ml)',
            route: AdministrationRoute.SUBCUTANEOUS,
            scheduledTime: minutesFromNow(180),
            status: PrescriptionStatus.PENDING,
            instructions: 'Aplicar refrigerado via subcutânea na região interescapular.',
          },
        ],
      },
    },
  });

  // --- Prescrição 3: Mel (Gatil Especial) - Prescrita por Dra. Madalena ---
  const prescMel = await prisma.prescription.create({
    data: {
      hospitalizationId: hospMel.id,
      prescribedById: vetUser.id,
      generalRecommendations:
        'Controle álgico multimodal. Acompanhar débito urinário em sistema fechado (meta: 1 a 2 ml/kg/h) e monitorar curva glicêmica. ATENÇÃO: Alérgica a Cefalexina!',
      isActive: true,
      validUntil: minutesFromNow(24 * 60),
    },
  });

  const itemMelSondaCheckOverdue = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescMel.id,
      itemType: PrescriptionItemType.PROCEDURE,
      title: 'Checagem de Permeabilidade da Sonda TomCat e Linha Coletora',
      dosage: null,
      route: null,
      scheduledTime: minutesAgo(15), // ATRASADA -> Prioridade ALTA
      status: PrescriptionStatus.PENDING,
      instructions: 'Inspecionar fixação no prepúcio/vulva, ausência de dobras e desobstrução suave com 1ml de SF se necessário.',
    },
  });

  const itemMelBuprenorfina = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescMel.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Buprenorfina 0.3 mg/ml',
      dosage: '0.02 mg/kg (0.28 ml)',
      route: AdministrationRoute.INTRAVENOUS,
      scheduledTime: minutesFromNow(30), // Prioridade MÉDIA
      status: PrescriptionStatus.PENDING,
      instructions: 'Analgesia opioide felina — administrar via intravenosa lenta.',
    },
  });

  await prisma.prescriptionItem.createMany({
    data: [
      {
        prescriptionId: prescMel.id,
        itemType: PrescriptionItemType.PROCEDURE,
        title: 'Lavagem Vesical Suave com SF 0.9% Morno (30 ml)',
        dosage: null,
        route: null,
        scheduledTime: minutesFromNow(75), // Prioridade BAIXA
        status: PrescriptionStatus.PENDING,
        instructions: 'Infundir lentamente 15ml, aspirar delicadamente e repetir com os 15ml restantes para remoção de microcálculos e plugue.',
      },
      {
        prescriptionId: prescMel.id,
        itemType: PrescriptionItemType.PROCEDURE,
        title: 'Mensuração de Débito Urinário e Limpeza do Cateter TomCat',
        dosage: null,
        route: null,
        scheduledTime: minutesFromNow(110), // Prioridade BAIXA
        status: PrescriptionStatus.PENDING,
        instructions: 'Esvaziar bolsa coletora graduada, anotar volume/aspecto e higienizar meato com clorexidina aquosa 0.2%.',
      },
      {
        prescriptionId: prescMel.id,
        itemType: PrescriptionItemType.VITAL_CHECK,
        title: 'Curva Glicêmica Capilar (Glicemia em Pavilhão Auricular)',
        dosage: null,
        route: null,
        scheduledTime: minutesFromNow(190),
        status: PrescriptionStatus.PENDING,
        instructions: 'Utilizar glicosímetro veterinário calibrado para felinos.',
      },
      {
        prescriptionId: prescMel.id,
        itemType: PrescriptionItemType.MEDICATION,
        title: 'Prazosina 0.5 mg (Cápsula Manipulada)',
        dosage: '1 cápsula (0.5 mg)',
        route: AdministrationRoute.ORAL,
        scheduledTime: minutesFromNow(240),
        status: PrescriptionStatus.PENDING,
        instructions: 'Relaxante de esfíncter uretral interno — administrar com 2ml de água.',
      },
    ],
  });

  const itemMelPrazosinaApplied = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescMel.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Prazosina 0.5 mg (Cápsula Manipulada)',
      dosage: '1 cápsula (0.5 mg)',
      route: AdministrationRoute.ORAL,
      scheduledTime: minutesAgo(80),
      status: PrescriptionStatus.APPLIED,
      instructions: 'Relaxante de esfíncter uretral interno — administrar com 2ml de água.',
    },
  });

  const itemMelSedacaoApplied = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescMel.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Sedação Pré-Sondagem: Midazolam 0.2 mg/kg + Cetamina 2 mg/kg IV',
      dosage: '0.17 ml Midazolam + 0.08 ml Cetamina',
      route: AdministrationRoute.INTRAVENOUS,
      scheduledTime: minutesAgo(180),
      status: PrescriptionStatus.APPLIED,
      instructions: 'Sedação dissociativa leve para hidropropulsão e passagem de cateter TomCat sem estresse.',
    },
  });

  const itemMelCefalexinaCancelled = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescMel.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Cefalexina Suspensão Oral 250 mg/5ml',
      dosage: '25 mg/kg (2.1 ml)',
      route: AdministrationRoute.ORAL,
      scheduledTime: minutesAgo(240),
      status: PrescriptionStatus.CANCELLED,
      instructions: 'Cancelado pela equipe médica após confirmação de alergia a cefalosporinas pelo tutor.',
    },
  });

  // --- Prescrição 4: Apollo (Canil Grande - Pós-DVG) - Prescrita por Dra. Camila (Admin) ---
  // Garante que ao logar com admin@nfcarevet.com ou crachá simulado, a aba "Suas Atividades" tenha tarefas!
  const prescApollo = await prisma.prescription.create({
    data: {
      hospitalizationId: hospApollo.id,
      prescribedById: adminUser.id,
      generalRecommendations:
        'Monitorização eletrocardiográfica contínua nas primeiras 48h pós-DVG pelo risco de complexos ventriculares prematuros (CVPs). Manter jejum sólido.',
      isActive: true,
      validUntil: minutesFromNow(24 * 60),
    },
  });

  const itemApolloEcgOverdue = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescApollo.id,
      itemType: PrescriptionItemType.VITAL_CHECK,
      title: 'Eletrocardiograma (ECG) de Controle + Pressão Arterial',
      dosage: null,
      route: null,
      scheduledTime: minutesAgo(12), // ATRASADA -> Prioridade ALTA (Aparece em Suas Atividades do Admin!)
      status: PrescriptionStatus.PENDING,
      instructions: 'Avaliar presença de taquicardia ventricular ou extrassístoles ventriculares em DII.',
    },
  });

  const itemApolloLidocaina = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescApollo.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Infusão Contínua de Lidocaína 2% (CRI 50 mcg/kg/min)',
      dosage: '5.76 ml/h em Bomba de Infusão',
      route: AdministrationRoute.INTRAVENOUS,
      scheduledTime: minutesFromNow(25), // Prioridade MÉDIA
      status: PrescriptionStatus.PENDING,
      instructions: 'Antiarrítmico de classe IB — manter bomba de seringa dedicada em acesso cefálico.',
    },
  });

  await prisma.prescriptionItem.createMany({
    data: [
      {
        prescriptionId: prescApollo.id,
        itemType: PrescriptionItemType.MEDICATION,
        title: 'Cloridrato de Metadona 10 mg/ml',
        dosage: '0.2 mg/kg (0.77 ml)',
        route: AdministrationRoute.INTRAMUSCULAR,
        scheduledTime: minutesFromNow(45), // Prioridade MÉDIA
        status: PrescriptionStatus.PENDING,
        instructions: 'Analgesia pós-gastropexia. Aplicar na musculatura epaxial.',
      },
      {
        prescriptionId: prescApollo.id,
        itemType: PrescriptionItemType.PROCEDURE,
        title: 'Curativo da Incisão Cirúrgica Abdominal (Gastropexia)',
        dosage: null,
        route: null,
        scheduledTime: minutesFromNow(210), // Prioridade BAIXA
        status: PrescriptionStatus.PENDING,
        instructions: 'Inspecionar linha de sutura quanto a seroma ou deiscência; limpar com SF 0.9% estéril.',
      },
      {
        prescriptionId: prescApollo.id,
        itemType: PrescriptionItemType.EXAM,
        title: 'Dosagem Seriada de Eletrólitos (Na+, K+, Cl-) e Lactato Sérico',
        dosage: null,
        route: null,
        scheduledTime: minutesFromNow(300),
        status: PrescriptionStatus.PENDING,
        instructions: 'Monitorar perfusão e prevenir hipocalemia secundária a estresse cirúrgico.',
      },
    ],
  });

  const itemApolloCefazolinaApplied = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescApollo.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Cefazolina Sódica 30 mg/kg IV',
      dosage: '1.15 g (diluído em 20 ml SF)',
      route: AdministrationRoute.INTRAVENOUS,
      scheduledTime: minutesAgo(120),
      status: PrescriptionStatus.APPLIED,
      instructions: 'Profilaxia antimicrobiana perioperatória administrada lentamente no intra/pós-operatório.',
    },
  });

  const itemApolloCarprofenoCancelled = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescApollo.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Carprofeno 4.4 mg/kg IV',
      dosage: '170 mg (3.4 ml)',
      route: AdministrationRoute.INTRAVENOUS,
      scheduledTime: minutesAgo(260),
      status: PrescriptionStatus.CANCELLED,
      instructions: 'AINE cancelado por risco de hemorragia gastrointestinal em mucosa gástrica pós-isquemia por torção.',
    },
  });

  // --- Prescrição 5: Bob (Canil Médio - Ortopedia) - Prescrita por Dr. Rafael Mendes ---
  const prescBob = await prisma.prescription.create({
    data: {
      hospitalizationId: hospBob.id,
      prescribedById: vetRafael.id,
      generalRecommendations:
        'Crioterapia no joelho direito operado a cada 6h por 15 minutos. Restrição de espaço na baia e uso obrigatório de colar elizabetano. ATENÇÃO: Alérgico a Penicilinas!',
      isActive: true,
      validUntil: minutesFromNow(48 * 60),
    },
  });

  const itemBobCurativoOverdue = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescBob.id,
      itemType: PrescriptionItemType.PROCEDURE,
      title: 'Troca de Atadura de Robert-Jones e Avaliação de Edema de Joelho',
      dosage: null,
      route: null,
      scheduledTime: minutesAgo(20), // ATRASADA -> Prioridade ALTA
      status: PrescriptionStatus.PENDING,
      instructions: 'Remover atadura, inspecionar suturas cutâneas e reaplicar curativo compressivo leve com acolchoamento.',
    },
  });

  const itemBobMeloxicam = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescBob.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Meloxicam 2 mg/ml',
      dosage: '0.1 mg/kg (1.45 ml)',
      route: AdministrationRoute.SUBCUTANEOUS,
      scheduledTime: minutesFromNow(55), // Prioridade MÉDIA
      status: PrescriptionStatus.PENDING,
      instructions: 'Anti-inflamatório não esteroidal pós-operatório (administrar após alimentação).',
    },
  });

  await prisma.prescriptionItem.createMany({
    data: [
      {
        prescriptionId: prescBob.id,
        itemType: PrescriptionItemType.PROCEDURE,
        title: 'Sessão de Crioterapia + Mobilização Passiva Suave',
        dosage: null,
        route: null,
        scheduledTime: minutesFromNow(140), // Prioridade BAIXA
        status: PrescriptionStatus.PENDING,
        instructions: 'Aplicar bolsa de gelo envolta em campo cirúrgico na região tibial proximal por 15 min.',
      },
      {
        prescriptionId: prescBob.id,
        itemType: PrescriptionItemType.MEDICATION,
        title: 'Cloridrato de Tramadol 50 mg/ml + Dipirona 500 mg/ml IV',
        dosage: '2.9 ml Tramadol + 1.45 ml Dipirona',
        route: AdministrationRoute.INTRAVENOUS,
        scheduledTime: minutesFromNow(180),
        status: PrescriptionStatus.PENDING,
        instructions: 'Analgesia multimodal pós-osteotomia. Infundir lentamente diluído em 15ml de SF 0.9%.',
      },
      {
        prescriptionId: prescBob.id,
        itemType: PrescriptionItemType.EXAM,
        title: 'Radiografia Ortopédica de Controle Pós-TPLO (Projeções ML e CC)',
        dosage: null,
        route: null,
        scheduledTime: minutesFromNow(300),
        status: PrescriptionStatus.PENDING,
        instructions: 'Verificar alinhamento da osteotomia radial e estabilidade dos parafusos corticais de titânio.',
      },
    ],
  });

  const itemBobCefalotinaApplied = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescBob.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Cefalotina 1g IV Profilaxia Ortopédica',
      dosage: '30 mg/kg (870 mg)',
      route: AdministrationRoute.INTRAVENOUS,
      scheduledTime: minutesAgo(150),
      status: PrescriptionStatus.APPLIED,
      instructions: 'Antimicrobiano profilático de escolha administrado no pós-operatório imediato.',
    },
  });

  const itemBobAmoxicilinaCancelled = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescBob.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Amoxicilina + Clavulanato de Potássio 250 mg',
      dosage: '12.5 mg/kg (1.5 comprimido)',
      route: AdministrationRoute.ORAL,
      scheduledTime: minutesAgo(320),
      status: PrescriptionStatus.CANCELLED,
      instructions: 'Cancelado de imediato devido a alerta de alergia a penicilinas no prontuário do paciente.',
    },
  });

  // --- Prescrição 6: Amora (Canil Pequeno - Braquicefálica) - Prescrita por Dr. Marcos Paxe (Mr Paxe) ---
  const prescAmora = await prisma.prescription.create({
    data: {
      hospitalizationId: hospAmora.id,
      prescribedById: vetPaxe.id,
      generalRecommendations:
        'Manter baia refrigerada a 21°C. Evitar qualquer excitação. Oxigenoterapia por máscara ou gaiola de O2 se apresentar estridor inspiratório.',
      isActive: true,
      validUntil: minutesFromNow(24 * 60),
    },
  });

  const itemAmoraVitalOverdue = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescAmora.id,
      itemType: PrescriptionItemType.VITAL_CHECK,
      title: 'Aferição Emergencial de Temperatura Retal e Oximetria (SpO2)',
      dosage: null,
      route: null,
      scheduledTime: minutesAgo(10), // ATRASADA -> Prioridade ALTA
      status: PrescriptionStatus.PENDING,
      instructions: 'Garantir que a temperatura corporal não ultrapasse 39.2 °C e SpO2 permaneça acima de 95%.',
    },
  });

  await prisma.prescriptionItem.createMany({
    data: [
      {
        prescriptionId: prescAmora.id,
        itemType: PrescriptionItemType.MEDICATION,
        title: 'Nebulização com Solução Fisiológica 0.9% + Acetilcisteína',
        dosage: '5 ml SF 0.9% + 0.5 ml Acetilcisteína',
        route: AdministrationRoute.INHALATION,
        scheduledTime: minutesFromNow(20), // Prioridade MÉDIA (Prescrita por Mr Paxe!)
        status: PrescriptionStatus.PENDING,
        instructions: 'Realizar nebulização dentro da baia por 15 minutos sem contenção física.',
      },
      {
        prescriptionId: prescAmora.id,
        itemType: PrescriptionItemType.MEDICATION,
        title: 'Butorfanol 0.2 mg/kg IV (Sedação Leve e Antitussígeno)',
        dosage: '0.22 ml Butorfanol 10 mg/ml',
        route: AdministrationRoute.INTRAVENOUS,
        scheduledTime: minutesFromNow(60),
        status: PrescriptionStatus.PENDING,
        instructions: 'Sedação leve para reduzir a frequência de esforço inspiratório.',
      },
      {
        prescriptionId: prescAmora.id,
        itemType: PrescriptionItemType.VITAL_CHECK,
        title: 'Monitoramento de Frequência Respiratória, SpO2 e Temperatura',
        dosage: null,
        route: null,
        scheduledTime: minutesFromNow(120),
        status: PrescriptionStatus.PENDING,
        instructions: 'Confirmar manutenção da temperatura abaixo de 39.0 °C e padrão respiratório.',
      },
    ],
  });

  const itemAmoraDexametasonaApplied = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescAmora.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Dexametasona Fosfato Dissódico 2 mg/ml IV',
      dosage: '0.2 mg/kg (1.1 ml)',
      route: AdministrationRoute.INTRAVENOUS,
      scheduledTime: minutesAgo(110),
      status: PrescriptionStatus.APPLIED,
      instructions: 'Anti-inflamatório corticoide de ação rápida para redução de edema agudo de glote/palato mole.',
    },
  });

  const itemAmoraCompressasApplied = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescAmora.id,
      itemType: PrescriptionItemType.PROCEDURE,
      title: 'Compressas Frias em Coxins e Região Inguinal',
      dosage: null,
      route: null,
      scheduledTime: minutesAgo(180),
      status: PrescriptionStatus.APPLIED,
      instructions: 'Resfriamento corporal controlado com toalhas umedecidas e ventilador na baia para reverter hipertermia de 40.4 °C.',
    },
  });

  const itemAmoraEnrofloxacinoCancelled = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescAmora.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Enrofloxacino 5% SC',
      dosage: '5 mg/kg (1.1 ml)',
      route: AdministrationRoute.SUBCUTANEOUS,
      scheduledTime: minutesAgo(220),
      status: PrescriptionStatus.CANCELLED,
      instructions: 'Cancelado pela equipe médica por se tratar de quadro puramente obstrutivo-térmico sem foco infeccioso.',
    },
  });

  // --- Prescrição 7: Simba (Gatil 02 - Cardiologia) - Prescrita por Dra. Camila (Admin) ---
  const prescSimba = await prisma.prescription.create({
    data: {
      hospitalizationId: hospSimba.id,
      prescribedById: adminUser.id,
      generalRecommendations:
        'Paciente cardiopata (CMH). Taxa de fluidoterapia restrita (manutenção conservadora) para evitar sobrecarga volêmica e edema pulmonar. ATENÇÃO: Alérgico a Quetamina!',
      isActive: true,
      validUntil: minutesFromNow(24 * 60),
    },
  });

  const itemSimbaRespOverdue = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescSimba.id,
      itemType: PrescriptionItemType.VITAL_CHECK,
      title: 'Controle de Frequência Respiratória em Repouso (Meta < 30 mpm)',
      dosage: null,
      route: null,
      scheduledTime: minutesAgo(18), // ATRASADA -> Prioridade ALTA
      status: PrescriptionStatus.PENDING,
      instructions: 'Contar movimentos respiratórios na baia sem abrir a porta para não assustar o felino.',
    },
  });

  const itemSimbaFurosemida = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescSimba.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Furosemida 10 mg/ml IV Bolus Lento',
      dosage: '1 mg/kg (0.78 ml)',
      route: AdministrationRoute.INTRAVENOUS,
      scheduledTime: minutesFromNow(30), // Prioridade MÉDIA
      status: PrescriptionStatus.PENDING,
      instructions: 'Diurético de alça para controle de congestão pulmonar incipiente.',
    },
  });

  await prisma.prescriptionItem.createMany({
    data: [
      {
        prescriptionId: prescSimba.id,
        itemType: PrescriptionItemType.MEDICATION,
        title: 'Clopidogrel 75 mg (1/4 de comprimido)',
        dosage: '18.75 mg / gato',
        route: AdministrationRoute.ORAL,
        scheduledTime: minutesFromNow(80), // Prioridade BAIXA
        status: PrescriptionStatus.PENDING,
        instructions: 'Antiagregante plaquetário — administrar em cápsula gelatinosa com pasta palatável.',
      },
      {
        prescriptionId: prescSimba.id,
        itemType: PrescriptionItemType.MEDICATION,
        title: 'Atenolol 25 mg (1/4 de comprimido)',
        dosage: '6.25 mg / gato VO',
        route: AdministrationRoute.ORAL,
        scheduledTime: minutesFromNow(150),
        status: PrescriptionStatus.PENDING,
        instructions: 'Betabloqueador para redução da frequência cardíaca e do gradiente pressórico no trato de saída.',
      },
      {
        prescriptionId: prescSimba.id,
        itemType: PrescriptionItemType.EXAM,
        title: 'Ecocardiograma Doppler de Controle à Beira do Leito (T-FAST)',
        dosage: null,
        route: null,
        scheduledTime: minutesFromNow(240),
        status: PrescriptionStatus.PENDING,
        instructions: 'Avaliar relação Átrio Esquerdo/Aorta (AE/Ao) e descartar linhas B pulmonares.',
      },
    ],
  });

  const itemSimbaFurosemidaApplied = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescSimba.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Furosemida 1 mg/kg IV na Admissão',
      dosage: '0.78 ml Furosemida 10 mg/ml',
      route: AdministrationRoute.INTRAVENOUS,
      scheduledTime: minutesAgo(160),
      status: PrescriptionStatus.APPLIED,
      instructions: 'Dose de ataque na admissão para controle de congestão venosa pulmonar.',
    },
  });

  const itemSimbaCetaminaCancelled = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescSimba.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Cetamina 10% IV',
      dosage: '2 mg/kg (0.16 ml)',
      route: AdministrationRoute.INTRAVENOUS,
      scheduledTime: minutesAgo(240),
      status: PrescriptionStatus.CANCELLED,
      instructions: 'Cancelado por contraindicação absoluta: paciente com alergia e histórico de taquicardia severa.',
    },
  });

  // --- Prescrição 8: Frida (Semi-Intensiva - Neurologia) - Prescrita por Dra. Madalena ---
  const prescFrida = await prisma.prescription.create({
    data: {
      hospitalizationId: hospFrida.id,
      prescribedById: vetUser.id,
      generalRecommendations:
        'Atenção: ALÉRGICA A TRAMADOL. Realizar manejo vesical (manobra de Credé suave) a cada 6h e mudança de decúbito em colchão caixa de ovo.',
      isActive: true,
      validUntil: minutesFromNow(24 * 60),
    },
  });

  const itemFridaCrede = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescFrida.id,
      itemType: PrescriptionItemType.PROCEDURE,
      title: 'Esvaziamento Vesical por Compressão Manual Suave (Manobra de Credé)',
      dosage: null,
      route: null,
      scheduledTime: minutesFromNow(25), // Prioridade MÉDIA
      status: PrescriptionStatus.PENDING,
      instructions: 'Comprimir suavemente bexiga urinária de cranial para caudal até esvaziamento completo.',
    },
  });

  const itemFridaGabapentina = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescFrida.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Gabapentina 50 mg (Cápsula)',
      dosage: '10 mg/kg (1 cápsula de 85 mg)',
      route: AdministrationRoute.ORAL,
      scheduledTime: minutesAgo(45), // ATRASADA -> Prioridade ALTA
      status: PrescriptionStatus.PENDING,
      instructions: 'Controle de dor neuropática pós-hemilaminectomia.',
    },
  });

  await prisma.prescriptionItem.createMany({
    data: [
      {
        prescriptionId: prescFrida.id,
        itemType: PrescriptionItemType.PROCEDURE,
        title: 'Fisioterapia Neurológica: Estímulo Proprioceptivo + Laserterapia',
        dosage: null,
        route: null,
        scheduledTime: minutesFromNow(80), // Prioridade BAIXA
        status: PrescriptionStatus.PENDING,
        instructions: 'Laser terapêutico na região T13-L1 e exercícios de estação assistida.',
      },
      {
        prescriptionId: prescFrida.id,
        itemType: PrescriptionItemType.PROCEDURE,
        title: 'Mudança de Decúbito Lateral e Massagem em Coxins',
        dosage: null,
        route: null,
        scheduledTime: minutesFromNow(160),
        status: PrescriptionStatus.PENDING,
        instructions: 'Mudar decúbito para prevenção de escaras e massagem suave de ativação reflexa.',
      },
      {
        prescriptionId: prescFrida.id,
        itemType: PrescriptionItemType.MEDICATION,
        title: 'Dipirona 500 mg/ml IV Lento',
        dosage: '25 mg/kg (0.43 ml)',
        route: AdministrationRoute.INTRAVENOUS,
        scheduledTime: minutesFromNow(220),
        status: PrescriptionStatus.PENDING,
        instructions: 'Antipirético e analgésico de suporte administrado em 2 minutos.',
      },
    ],
  });

  const itemFridaMetadonaApplied = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescFrida.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Cloridrato de Metadona 0.2 mg/kg SC',
      dosage: '0.17 ml Metadona 10 mg/ml',
      route: AdministrationRoute.SUBCUTANEOUS,
      scheduledTime: minutesAgo(140),
      status: PrescriptionStatus.APPLIED,
      instructions: 'Analgesia espinhal de resgate aplicada com sucesso sem queixas de dor.',
    },
  });

  const itemFridaTramadolCancelled = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescFrida.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Cloridrato de Tramadol 50 mg/ml SC',
      dosage: '2 mg/kg (0.34 ml)',
      route: AdministrationRoute.SUBCUTANEOUS,
      scheduledTime: minutesAgo(260),
      status: PrescriptionStatus.CANCELLED,
      instructions: 'Cancelado devido a histórico severo de êmese e disforia induzidos por tramadol.',
    },
  });

  // --- Prescrição 9: Luna (Isolamento - Nefrologia) - Prescrita por Dra. Madalena ---
  // Inclui 1 prescrição anterior inativada para demonstrar histórico de ajuste terapêutico
  await prisma.prescription.create({
    data: {
      hospitalizationId: hospLuna.id,
      prescribedById: vetUser.id,
      generalRecommendations: 'Prescrição inicial de estabilização urêmica das primeiras 72h (Substituída).',
      isActive: false,
      createdAt: daysAgo(5),
    },
  });

  const prescLuna = await prisma.prescription.create({
    data: {
      hospitalizationId: hospLuna.id,
      prescribedById: vetUser.id,
      generalRecommendations:
        'Manter fluidoterapia IV balanceada conforme reposição de perdas. Estimular ingestão voluntária com sachê Renal morno.',
      isActive: true,
      validUntil: minutesFromNow(24 * 60),
    },
  });

  const itemLunaBombaOverdue = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescLuna.id,
      itemType: PrescriptionItemType.PROCEDURE,
      title: 'Checagem de Bomba de Infusão e Taxa de Fluidoterapia (12 ml/h)',
      dosage: null,
      route: null,
      scheduledTime: minutesAgo(25), // ATRASADA -> Prioridade ALTA
      status: PrescriptionStatus.PENDING,
      instructions: 'Conferir volume infundido acumulado, ausência de oclusão e turgor cutâneo.',
    },
  });

  const itemLunaHidroxido = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescLuna.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Hidróxido de Alumínio (Quelante de Fósforo)',
      dosage: '30 mg/kg (1.1 ml)',
      route: AdministrationRoute.ORAL,
      scheduledTime: minutesFromNow(40), // Prioridade MÉDIA
      status: PrescriptionStatus.PENDING,
      instructions: 'Administrar misturado ao alimento úmido renal.',
    },
  });

  await prisma.prescriptionItem.createMany({
    data: [
      {
        prescriptionId: prescLuna.id,
        itemType: PrescriptionItemType.MEDICATION,
        title: 'Enrofloxacino 5% Diluído em SF 0.9% IV Lento',
        dosage: '5 mg/kg (0.36 ml)',
        route: AdministrationRoute.INTRAVENOUS,
        scheduledTime: minutesFromNow(90), // Prioridade BAIXA
        status: PrescriptionStatus.PENDING,
        instructions: 'Tratamento de pielonefrite ascendente. Infundir diluído em 10ml de SF ao longo de 20 min.',
      },
      {
        prescriptionId: prescLuna.id,
        itemType: PrescriptionItemType.VITAL_CHECK,
        title: 'Aferição de Pressão Arterial Doppler em Cauda (Controle de Nefropatia)',
        dosage: null,
        route: null,
        scheduledTime: minutesFromNow(150),
        status: PrescriptionStatus.PENDING,
        instructions: 'Manguito neonatal #2 na base da cauda; registrar 5 aferições consecutivas.',
      },
      {
        prescriptionId: prescLuna.id,
        itemType: PrescriptionItemType.EXAM,
        title: 'Painel Bioquímico Renal Seriado (Ureia, Creatinina, Fósforo, Potássio)',
        dosage: null,
        route: null,
        scheduledTime: minutesFromNow(280),
        status: PrescriptionStatus.PENDING,
        instructions: 'Comparar com creatinina basal de admissão (4.8 mg/dL -> último controle 2.9 mg/dL).',
      },
    ],
  });

  const itemLunaMirtazapinaApplied = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescLuna.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Mirtazapina 2 mg Pomada Transdérmica Auricular',
      dosage: '1 tira de 3.8 cm (2 mg)',
      route: AdministrationRoute.ORAL,
      scheduledTime: minutesAgo(150),
      status: PrescriptionStatus.APPLIED,
      instructions: 'Aplicar na face interna do pavilhão auricular alternando as orelhas para estímulo de apetite.',
    },
  });

  const itemLunaOndansetronaApplied = await prisma.prescriptionItem.create({
    data: {
      prescriptionId: prescLuna.id,
      itemType: PrescriptionItemType.MEDICATION,
      title: 'Ondansetrona 2 mg/ml IV Lento',
      dosage: '0.5 mg/kg (0.9 ml)',
      route: AdministrationRoute.INTRAVENOUS,
      scheduledTime: minutesAgo(210),
      status: PrescriptionStatus.APPLIED,
      instructions: 'Antiemético para alívio de náusea urêmica antes da refeição.',
    },
  });

  // 10. Eventos Clínicos e Linha do Tempo (Timeline rica para todos os pacientes e executores)
  console.log('⏱️ Criando histórico detalhado de eventos clínicos e sinais vitais...');

  // =========================================================================
  // TIMELINE DO THOR (14 eventos variados -> permite testar paginação e todos os filtros de EventType!)
  // =========================================================================
  await prisma.clinicalEvent.createMany({
    data: [
      {
        hospitalizationId: hospThor.id,
        userId: vetUser.id,
        eventType: EventType.VITAL_SIGNS,
        title: 'Aferição de Sinais Vitais - Estável',
        description:
          'Paciente alerta e responsivo na baia. Mucosas róseas e úmidas, turgor cutâneo recuperado após etapa de expansão volêmica. Sem dor à palpação abdominal.',
        metrics: {
          heartRate: 112,
          respiratoryRate: 22,
          temperature: 38.6,
          systolicBP: 124,
          diastolicBP: 76,
          meanBP: 92,
          bloodGlucose: 96,
          capillaryRefillTime: '< 2s',
          notes: 'Pulso femoral forte e normocinético.',
        },
        recordedAt: todayAgo(25),
      },
      {
        hospitalizationId: hospThor.id,
        userId: recUser.id,
        eventType: EventType.ELIMINATION,
        title: 'Micção Espontânea em Tapete Higiênico',
        description:
          'Urina amarelo-citrina límpida em bom volume (aprox. 250 ml). Sem novos episódios de hematoquezia ou êmese nas últimas 3 horas.',
        recordedAt: todayAgo(55),
      },
      {
        hospitalizationId: hospThor.id,
        userId: vetPaxe.id,
        eventType: EventType.EXAM,
        title: 'Hemogasometria Venosa + Eletrólitos à Beira do Leito',
        description:
          'Discreta acidose metabólica compensada (pH 7.36, HCO3 20.4 mmol/L). Potássio corrigido (4.1 mEq/L) e lactato em queda (1.8 mmol/L).',
        metrics: {
          bloodGlucose: 94,
          notes: 'pH: 7.36 | K+: 4.1 mEq/L | Na+: 145 mEq/L | Lactato: 1.8 mmol/L',
        },
        recordedAt: todayAgo(90),
      },
      {
        hospitalizationId: hospThor.id,
        prescriptionItemId: itemThorOmeprazolApplied.id,
        userId: vetUser.id,
        eventType: EventType.MEDICATION_APPLICATION,
        title: 'Execução de item: Omeprazol Sódico 4 mg/ml (IV)',
        description: 'Medicamento protetor gástrico administrado lentamente pelo acesso venoso cefálico sem intercorrências.',
        recordedAt: todayAgo(120),
      },
      {
        hospitalizationId: hospThor.id,
        userId: adminUser.id,
        eventType: EventType.VITAL_SIGNS,
        title: 'Reavaliação Hemodinâmica Pós-Prova de Carga',
        description: 'Melhora da frequência cardíaca e normalização do tempo de preenchimento capilar após bolus de Ringer Lactato.',
        metrics: {
          heartRate: 124,
          respiratoryRate: 26,
          temperature: 38.9,
          systolicBP: 118,
          diastolicBP: 72,
          bloodGlucose: 91,
          capillaryRefillTime: '2s',
          notes: 'Hidratação ajustada para taxa de manutenção + perdas (120 ml/h).',
        },
        recordedAt: todayAgo(150),
      },
      {
        hospitalizationId: hospThor.id,
        userId: recUser.id,
        eventType: EventType.FEEDING,
        title: 'Instituição de Repouso Gástrico e Jejum Clínico',
        description: 'Retirada de água e alimento sólido por 12h para controle emético e preparo para ultrassonografia abdominal.',
        recordedAt: todayAgo(170),
      },
      {
        hospitalizationId: hospThor.id,
        prescriptionItemId: itemThorDipironaCancelled.id,
        userId: vetUser.id,
        eventType: EventType.OBSERVATION,
        title: 'Item suspenso: Dipirona Sódica 500 mg/ml',
        description:
          'Justificativa médica: Paciente possui histórico de alergia severa a Dipirona registrado no prontuário | Observações: Substituído por controle álgico multimodal sem metamizol.',
        metrics: {
          action: 'CANCEL_PRESCRIPTION_ITEM',
          justification: 'Paciente possui histórico de alergia severa a Dipirona registrado no prontuário',
        },
        recordedAt: todayAgo(180),
      },
      {
        hospitalizationId: hospThor.id,
        userId: vetUser.id,
        eventType: EventType.PROCEDURE,
        title: 'Cateterismo Venoso Periférico (Veia Cefálica Direita - Cateter 20G)',
        description: 'Antissepsia cirúrgica com clorexidina alcoólica 0.5%, fixação segura e início de fluidoterapia aquecida.',
        recordedAt: todayAgo(210),
      },
      {
        hospitalizationId: hospThor.id,
        userId: adminUser.id,
        eventType: EventType.OBSERVATION,
        title: 'Vínculo de Tag NFC',
        description: `Tag NFC [${tagThor.tagUid}] (${tagThor.publicCode}) vinculada à coleira hospitalar do paciente Thor.`,
        metrics: {
          tagUid: tagThor.tagUid,
          publicCode: tagThor.publicCode,
        },
        recordedAt: todayAgo(225),
      },
      {
        hospitalizationId: hospThor.id,
        userId: vetUser.id,
        eventType: EventType.VITAL_SIGNS,
        title: 'Sinais Vitais de Admissão na UTI',
        description: 'Paciente admitido taquicárdico, mucosas congestas, desidratação estimada em 7% e desconforto abdominal.',
        metrics: {
          heartRate: 142,
          respiratoryRate: 32,
          temperature: 39.3,
          systolicBP: 102,
          diastolicBP: 64,
          bloodGlucose: 88,
          capillaryRefillTime: '3s',
          notes: 'Iniciada ressuscitação volêmica imediata.',
        },
        recordedAt: todayAgo(235),
      },
      {
        hospitalizationId: hospThor.id,
        userId: vetUser.id,
        eventType: EventType.OBSERVATION,
        title: 'Admissão Hospitalar (Check-in) - UTI Canina',
        description:
          'Paciente Thor admitido na Baia 01 - UTI Canina. Motivo: Gastroenterite hemorrágica aguda e desidratação moderada (7%). Alertas revisados com o tutor Lucas Silva.',
        recordedAt: todayAgo(240),
      },
    ],
  });

  // =========================================================================
  // TIMELINE DA MEL (Gatil Especial)
  // =========================================================================
  await prisma.clinicalEvent.createMany({
    data: [
      {
        hospitalizationId: hospMel.id,
        userId: vetUser.id,
        eventType: EventType.VITAL_SIGNS,
        title: 'Sinais Vitais e Monitorização Pós-Desobstrução',
        description: 'Paciente calma no gatil climatizado, normotérmica e confortável após analgesia.',
        metrics: {
          heartRate: 168,
          respiratoryRate: 28,
          temperature: 38.4,
          systolicBP: 128,
          diastolicBP: 82,
          bloodGlucose: 184,
          capillaryRefillTime: '< 2s',
          notes: 'Glicemia de estresse em declínio (admissão: 248 mg/dL).',
        },
        recordedAt: todayAgo(35),
      },
      {
        hospitalizationId: hospMel.id,
        userId: recFernanda.id,
        eventType: EventType.ELIMINATION,
        title: 'Controle de Débito Urinário em Sistema Fechado',
        description: 'Coletados 18 ml de urina levemente hematúrica nas últimas 2h (débito adequado: 2.1 ml/kg/h). Sonda pérvia.',
        recordedAt: todayAgo(60),
      },
      {
        hospitalizationId: hospMel.id,
        prescriptionItemId: itemMelPrazosinaApplied.id,
        userId: vetUser.id,
        eventType: EventType.MEDICATION_APPLICATION,
        title: 'Execução de item: Prazosina 0.5 mg (VO)',
        description: 'Administrada sem estresse utilizando aplicador de comprimidos macio.',
        recordedAt: todayAgo(80),
      },
      {
        hospitalizationId: hospMel.id,
        userId: vetUser.id,
        eventType: EventType.PROCEDURE,
        title: 'Desobstrução Uretral e Sondagem Vesical de Demora',
        description:
          'Sob sedação dissociativa leve e bloqueio sacrococcígeo, realizada hidropropulsão retrógrada e fixação de sonda TomCat com lavagem vesical abundante em SF 0.9% morno.',
        recordedAt: todayAgo(125),
      },
      {
        hospitalizationId: hospMel.id,
        prescriptionItemId: itemMelSedacaoApplied.id,
        userId: vetUser.id,
        eventType: EventType.MEDICATION_APPLICATION,
        title: 'Execução de item: Sedação Pré-Sondagem (Midazolam + Cetamina IV)',
        description: 'Paciente sedada adequadamente sem intercorrências hemodinâmicas.',
        recordedAt: todayAgo(180),
      },
      {
        hospitalizationId: hospMel.id,
        prescriptionItemId: itemMelCefalexinaCancelled.id,
        userId: vetUser.id,
        eventType: EventType.OBSERVATION,
        title: 'Item suspenso: Cefalexina Suspensão Oral 250 mg/5ml',
        description:
          'Justificativa médica: Tutor informou histórico de reação alérgica cutânea a cefalexina durante triagem. Antibioticoterapia suspensa temporariamente.',
        metrics: {
          action: 'CANCEL_PRESCRIPTION_ITEM',
          justification: 'Histórico de alergia a cefalexina',
        },
        recordedAt: todayAgo(240),
      },
      {
        hospitalizationId: hospMel.id,
        userId: vetUser.id,
        eventType: EventType.OBSERVATION,
        title: 'Admissão Hospitalar (Check-in) - Gatil Especial',
        description: 'Paciente Mel admitida na Baia 03 - Gatil Especial com bexiga repleta e vocalização álgica.',
        recordedAt: todayAgo(150),
      },
    ],
  });

  // =========================================================================
  // TIMELINE DO APOLLO (Canil Grande - Pós-DVG)
  // =========================================================================
  await prisma.clinicalEvent.createMany({
    data: [
      {
        hospitalizationId: hospApollo.id,
        userId: adminUser.id,
        eventType: EventType.VITAL_SIGNS,
        title: 'Monitorização Pós-Operatória de Gastropexia',
        description: 'Paciente acordado da anestesia inalatória, em decúbito esternal, traçado de ECG em ritmo sinusal regular.',
        metrics: {
          heartRate: 108,
          respiratoryRate: 24,
          temperature: 38.2,
          systolicBP: 130,
          diastolicBP: 80,
          bloodGlucose: 105,
          capillaryRefillTime: '< 2s',
          notes: 'Sem extrassístoles ventriculares no monitor multiparamétrico.',
        },
        recordedAt: todayAgo(45),
      },
      {
        hospitalizationId: hospApollo.id,
        prescriptionItemId: itemApolloCefazolinaApplied.id,
        userId: vetUser.id,
        eventType: EventType.MEDICATION_APPLICATION,
        title: 'Execução de item: Cefazolina Sódica 30 mg/kg IV',
        description: 'Infundida lentamente em acesso venoso periférico cefálico sem hipotensão.',
        recordedAt: todayAgo(120),
      },
      {
        hospitalizationId: hospApollo.id,
        userId: vetRafael.id,
        eventType: EventType.PROCEDURE,
        title: 'Cirurgia de Descompressão Gástrica e Gastropexia Incisional',
        description:
          'Reposicionamento gástrico bem-sucedido (rotação de 180° sem necrose esplênica ou gástrica). Realizada gastropexia incisional direita firme e lavagem cavitária.',
        recordedAt: todayAgo(190),
      },
      {
        hospitalizationId: hospApollo.id,
        prescriptionItemId: itemApolloCarprofenoCancelled.id,
        userId: adminUser.id,
        eventType: EventType.OBSERVATION,
        title: 'Item suspenso: Carprofeno 4.4 mg/kg IV',
        description:
          'Justificativa médica: Suspensão de AINE para proteção gástrica após episódio agudo de vólvulo gástrico.',
        metrics: {
          action: 'CANCEL_PRESCRIPTION_ITEM',
          justification: 'Proteção de mucosa gástrica pós-DVG',
        },
        recordedAt: todayAgo(260),
      },
      {
        hospitalizationId: hospApollo.id,
        userId: adminUser.id,
        eventType: EventType.OBSERVATION,
        title: 'Admissão de Emergência e Vínculo de Coleira NFC',
        description: `Paciente Apollo admitido em emergência cirúrgica na Baia 05. Tag NFC [${tagApollo.publicCode}] vinculada.`,
        recordedAt: todayAgo(320),
      },
    ],
  });

  // =========================================================================
  // TIMELINE DO BOB (Canil Médio - Ortopedia TPLO)
  // =========================================================================
  await prisma.clinicalEvent.createMany({
    data: [
      {
        hospitalizationId: hospBob.id,
        userId: vetRafael.id,
        eventType: EventType.VITAL_SIGNS,
        title: 'Aferição de Rotina e Avaliação Ortopédica',
        description: 'Ferida cirúrgica limpa e seca, edema articular discreto compatível com 48h pós-TPLO. Começando a apoiar pinça do membro pélvico direito.',
        metrics: {
          heartRate: 94,
          respiratoryRate: 18,
          temperature: 38.5,
          systolicBP: 120,
          diastolicBP: 75,
          capillaryRefillTime: '< 2s',
          notes: 'Escore de dor Glasgow: 2/24 (confortável).',
        },
        recordedAt: todayAgo(70),
      },
      {
        hospitalizationId: hospBob.id,
        prescriptionItemId: itemBobCefalotinaApplied.id,
        userId: vetRafael.id,
        eventType: EventType.MEDICATION_APPLICATION,
        title: 'Execução de item: Cefalotina 1g IV Profilaxia Ortopédica',
        description: 'Dose profilática intra e pós-operatória administrada sem sinais de hipersensibilidade.',
        recordedAt: todayAgo(150),
      },
      {
        hospitalizationId: hospBob.id,
        userId: recUser.id,
        eventType: EventType.FEEDING,
        title: 'Alimentação Assistida (Ração Úmida Recovery) Antes do Jejum',
        description: 'Ingeriu 100% da porção ofertada com ótimo apetite antes do início do jejum para radiografia de controle sob sedação.',
        recordedAt: daysAgo(1, 2),
      },
      {
        hospitalizationId: hospBob.id,
        prescriptionItemId: itemBobAmoxicilinaCancelled.id,
        userId: vetRafael.id,
        eventType: EventType.OBSERVATION,
        title: 'Item suspenso: Amoxicilina + Clavulanato de Potássio 250 mg',
        description:
          'Justificativa médica: Alerta de alergia a derivados de penicilina checado. Tratamento mantido com cefalosporinas.',
        metrics: {
          action: 'CANCEL_PRESCRIPTION_ITEM',
          justification: 'Alerta de alergia a penicilina',
        },
        recordedAt: daysAgo(1, 4),
      },
      {
        hospitalizationId: hospBob.id,
        userId: vetRafael.id,
        eventType: EventType.EXAM,
        title: 'Radiografia Pós-Operatória Imediata (Joelho Direito - Craniocaudal e Mediolateral)',
        description: 'Placa bloqueada TPLO e parafusos bicorticais perfeitamente posicionados. Ângulo do platô tibial corrigido para 5°.',
        recordedAt: daysAgo(2, 1),
      },
    ],
  });

  // =========================================================================
  // TIMELINE DA AMORA (Canil Pequeno - Braquicefálica)
  // =========================================================================
  await prisma.clinicalEvent.createMany({
    data: [
      {
        hospitalizationId: hospAmora.id,
        userId: vetPaxe.id,
        eventType: EventType.VITAL_SIGNS,
        title: 'Controle Respiratório e Térmico',
        description: 'Padrão respiratório costoabdominal suave, ausência de cianose ou estridor laríngeo em repouso.',
        metrics: {
          heartRate: 118,
          respiratoryRate: 26,
          temperature: 38.4,
          systolicBP: 116,
          diastolicBP: 70,
          capillaryRefillTime: '< 2s',
          notes: 'SpO2 em ar ambiente: 98%.',
        },
        recordedAt: todayAgo(85),
      },
      {
        hospitalizationId: hospAmora.id,
        prescriptionItemId: itemAmoraDexametasonaApplied.id,
        userId: vetPaxe.id,
        eventType: EventType.MEDICATION_APPLICATION,
        title: 'Execução de item: Dexametasona Fosfato Dissódico 2 mg/ml IV',
        description: 'Administração IV em bolus lento para alívio imediato do edema de palato e mucosa laríngea.',
        recordedAt: todayAgo(110),
      },
      {
        hospitalizationId: hospAmora.id,
        prescriptionItemId: itemAmoraCompressasApplied.id,
        userId: recFernanda.id,
        eventType: EventType.PROCEDURE,
        title: 'Execução de item: Compressas Frias em Coxins e Região Inguinal',
        description: 'Temperatura corporal caiu de 40.4 °C para 38.9 °C em 40 minutos com resfriamento ativo.',
        recordedAt: todayAgo(180),
      },
      {
        hospitalizationId: hospAmora.id,
        prescriptionItemId: itemAmoraEnrofloxacinoCancelled.id,
        userId: vetPaxe.id,
        eventType: EventType.OBSERVATION,
        title: 'Item suspenso: Enrofloxacino 5% SC',
        description:
          'Justificativa médica: Sem sinais clínicos ou laboratoriais de infecção bacteriana; episódio puramente obstrutivo e térmico.',
        metrics: {
          action: 'CANCEL_PRESCRIPTION_ITEM',
          justification: 'Uso racional de antimicrobianos',
        },
        recordedAt: todayAgo(220),
      },
      {
        hospitalizationId: hospAmora.id,
        userId: vetPaxe.id,
        eventType: EventType.PROCEDURE,
        title: 'Oxigenoterapia em Gaiola Climatizada + Resfriamento Gradual',
        description: 'Estabilização inicial com O2 suplementar a 40% e aplicação de Dexametasona IV para redução de edema de palato mole.',
        recordedAt: daysAgo(1, 2),
      },
    ],
  });

  // =========================================================================
  // TIMELINE DO SIMBA (Gatil 02 - Cardiologia)
  // =========================================================================
  await prisma.clinicalEvent.createMany({
    data: [
      {
        hospitalizationId: hospSimba.id,
        userId: adminUser.id,
        eventType: EventType.VITAL_SIGNS,
        title: 'Auscultação Cardiopulmonar e Sinais Vitais',
        description: 'Sopro sistólico grau III/VI em bordo esternal esquerdo, campos pulmonares limpos sem crepitações. Pulsos femorais bilaterais presentes e simétricos.',
        metrics: {
          heartRate: 156,
          respiratoryRate: 24,
          temperature: 38.1,
          systolicBP: 132,
          diastolicBP: 84,
          capillaryRefillTime: '< 2s',
          notes: 'Coxins pélvicos aquecidos e rosados.',
        },
        recordedAt: todayAgo(110),
      },
      {
        hospitalizationId: hospSimba.id,
        prescriptionItemId: itemSimbaFurosemidaApplied.id,
        userId: adminUser.id,
        eventType: EventType.MEDICATION_APPLICATION,
        title: 'Execução de item: Furosemida 1 mg/kg IV na Admissão',
        description: 'Diurético de alça administrado para prevenir descompensação de edema pulmonar.',
        recordedAt: todayAgo(160),
      },
      {
        hospitalizationId: hospSimba.id,
        prescriptionItemId: itemSimbaCetaminaCancelled.id,
        userId: adminUser.id,
        eventType: EventType.OBSERVATION,
        title: 'Item suspenso: Cetamina 10% IV',
        description:
          'Justificativa médica: Contraindicado por histórico de alergia e taquicardia severa. Monitorização eletrocardiográfica atenta.',
        metrics: {
          action: 'CANCEL_PRESCRIPTION_ITEM',
          justification: 'Histórico de alergia grave a cetamina',
        },
        recordedAt: todayAgo(240),
      },
      {
        hospitalizationId: hospSimba.id,
        userId: recFernanda.id,
        eventType: EventType.FEEDING,
        title: 'Ingestão Espontânea de Sachê Felino Hipossódico',
        description: 'Aceitou metade do sachê ofertado na prateleira superior do gatil.',
        recordedAt: daysAgo(1, 5),
      },
    ],
  });

  // =========================================================================
  // TIMELINE DA FRIDA (Semi-Intensiva - Neurologia)
  // =========================================================================
  await prisma.clinicalEvent.createMany({
    data: [
      {
        hospitalizationId: hospFrida.id,
        userId: vetUser.id,
        eventType: EventType.VITAL_SIGNS,
        title: 'Avaliação Neurológica e Sinais Vitais',
        description: 'Dor profunda preservada em ambos os membros pélvicos, retorno gradual de tônus extensor e reflexo patelar normorreflexo.',
        metrics: {
          heartRate: 104,
          respiratoryRate: 20,
          temperature: 38.3,
          systolicBP: 122,
          diastolicBP: 78,
          capillaryRefillTime: '< 2s',
          notes: 'Grau funcional neurológico evoluiu de III para II.',
        },
        recordedAt: todayAgo(65),
      },
      {
        hospitalizationId: hospFrida.id,
        userId: vetUser.id,
        eventType: EventType.ELIMINATION,
        title: 'Esvaziamento Vesical por Compressão Manual Suave (Manobra de Credé)',
        description: 'Urina límpida sem odor fétido (90 ml). Prevenção de atonia detrusora e cistite de retenção.',
        recordedAt: todayAgo(140),
      },
      {
        hospitalizationId: hospFrida.id,
        prescriptionItemId: itemFridaMetadonaApplied.id,
        userId: vetUser.id,
        eventType: EventType.MEDICATION_APPLICATION,
        title: 'Execução de item: Cloridrato de Metadona 0.2 mg/kg SC',
        description: 'Analgesia profunda administrada sem sedação excessiva ou alterações pupilares.',
        recordedAt: todayAgo(140),
      },
      {
        hospitalizationId: hospFrida.id,
        prescriptionItemId: itemFridaTramadolCancelled.id,
        userId: vetUser.id,
        eventType: EventType.OBSERVATION,
        title: 'Item suspenso: Cloridrato de Tramadol 50 mg/ml SC',
        description:
          'Justificativa médica: Alergia a tramadol confirmada pelo tutor (disforia, náusea intensa e agitação psicomotora).',
        metrics: {
          action: 'CANCEL_PRESCRIPTION_ITEM',
          justification: 'Alergia a tramadol com disforia',
        },
        recordedAt: todayAgo(260),
      },
    ],
  });

  // =========================================================================
  // TIMELINE DA LUNA (Isolamento - Nefrologia)
  // =========================================================================
  await prisma.clinicalEvent.createMany({
    data: [
      {
        hospitalizationId: hospLuna.id,
        userId: vetUser.id,
        eventType: EventType.VITAL_SIGNS,
        title: 'Aferição de Sinais Vitais e Peso Diário',
        description: 'Ganho de 120g de massa corporal em relação à admissão. Mucosas normocoradas, paciente ativa e ronronando.',
        metrics: {
          heartRate: 162,
          respiratoryRate: 26,
          temperature: 38.3,
          systolicBP: 134,
          diastolicBP: 82,
          bloodGlucose: 102,
          capillaryRefillTime: '< 2s',
          notes: 'Pressão arterial controlada sem proteinúria significativa.',
        },
        recordedAt: todayAgo(95),
      },
      {
        hospitalizationId: hospLuna.id,
        prescriptionItemId: itemLunaMirtazapinaApplied.id,
        userId: vetUser.id,
        eventType: EventType.MEDICATION_APPLICATION,
        title: 'Execução de item: Mirtazapina 2 mg Pomada Transdérmica Auricular',
        description: 'Aplicada com luva na face interna da orelha direita para estímulo de apetite.',
        recordedAt: todayAgo(150),
      },
      {
        hospitalizationId: hospLuna.id,
        prescriptionItemId: itemLunaOndansetronaApplied.id,
        userId: vetUser.id,
        eventType: EventType.MEDICATION_APPLICATION,
        title: 'Execução de item: Ondansetrona 2 mg/ml IV Lento',
        description: 'Antiemético administrado em 3 minutos para controle de gastrite urêmica.',
        recordedAt: todayAgo(210),
      },
      {
        hospitalizationId: hospLuna.id,
        userId: recUser.id,
        eventType: EventType.FEEDING,
        title: 'Aceitação Espontânea de Dieta Renal Úmida Aquecida',
        description: 'Ingeriu 45g de sachê Royal Canin Renal morno de forma voluntária — primeira refeição completa sem necessidade de alimentação assistida.',
        recordedAt: daysAgo(1, 1),
      },
    ],
  });

  // =========================================================================
  // EVENTOS DAS ALTAS E TRANSFERÊNCIAS (Max, Bidu, Pipoca, Nina)
  // =========================================================================
  await prisma.clinicalEvent.createMany({
    data: [
      {
        hospitalizationId: hospMaxDischarged.id,
        userId: vetUser.id,
        eventType: EventType.OBSERVATION,
        title: 'Alta Médica Hospitalar',
        description:
          'Encerramento de internação concedido ao paciente Max. | Motivo da alta: CURED | Evolução/Instruções: Remissão completa dos episódios de tosse e febre. | Recomendações ao tutor: Manter inalação domiciliar com SF 0.9% 2x ao dia por 5 dias.',
        recordedAt: todayAgo(50),
      },
      {
        hospitalizationId: hospBiduDischarged.id,
        userId: adminUser.id,
        eventType: EventType.OBSERVATION,
        title: 'Alta Médica Hospitalar',
        description:
          'Encerramento de internação concedido ao paciente Bidu. | Motivo da alta: CURED | Evolução/Instruções: Regressão total do angioedema facial após terapia anti-histamínica e corticoterapia. | Recomendações ao tutor: Observar nas próximas 24h.',
        recordedAt: todayAgo(30),
      },
      {
        hospitalizationId: hospPipocaDischarged.id,
        userId: vetPaxe.id,
        eventType: EventType.OBSERVATION,
        title: 'Alta Médica Hospitalar',
        description:
          'Encerramento de internação concedido à paciente Pipoca após estabilização gastrointestinal e retorno do apetite.',
        recordedAt: daysAgo(2, 6),
      },
      {
        hospitalizationId: hospNinaTransferred.id,
        userId: vetUser.id,
        eventType: EventType.OBSERVATION,
        title: 'Transferência Externa Hospitalar',
        description:
          'Paciente Nina encaminhada com relatório completo e exames laboratoriais para centro especializado de hemodiálise veterinária.',
        recordedAt: daysAgo(1, 4),
      },
    ],
  });

  console.log('✅ Seed rico de teste finalizado com sucesso!');
  console.log('===================================================================');
  console.log('🔑 Credenciais de Acesso Rápido:');
  console.log(`- Veterinária Chefe: ${vetUser.email} / vet12345 (Dra. Madalena - Crachá: BADGE002)`);
  console.log(`- Administradora:    ${adminUser.email} / admin123 (Dra. Camila - Crachá Simulado: BADGE001 / BA:DG:E0:01)`);
  console.log(`- Veterinário:       ${vetPaxe.email} / vet12345 (Dr. Marcos Paxe "Mr Paxe" - Crachá: BADGE004)`);
  console.log(`- Cirurgião:         ${vetRafael.email} / vet12345 (Dr. Rafael Mendes - Crachá: BADGE005)`);
  console.log(`- Recepção Diurna:   ${recUser.email} / rec12345 (Carlos - Crachá: BADGE003)`);
  console.log(`- Recepção Noturna:  ${recFernanda.email} / rec12345 (Fernanda - Crachá: BADGE006)`);
  console.log('-------------------------------------------------------------------');
  console.log('📊 Resumo do Ambiente Populacionado:');
  console.log('- 12 Baias (11 ativas: 8 ocupadas e 3 livres + 1 em manutenção)');
  console.log('- 11 Tags NFC no inventário (3 vinculadas, 7 livres, 1 inativa)');
  console.log('- 9 Tutores (Status: PAID, PENDING e OVERDUE | Inclui "Lucas Silva")');
  console.log('- 16 Pacientes (8 internados ativos + 8 ambulatoriais/altas/transferidos)');
  console.log('-------------------------------------------------------------------');
  console.log('🐾 Pacientes Internados Ativos:');
  console.log(`1. ${patientThor.name} (Golden Retriever) -> ${kennels[0].name} [Tag: ${tagThor.publicCode} / ${tagThor.tagUid}]`);
  console.log(`2. ${patientApollo.name} (Pastor Alemão)    -> ${kennels[4].name} [Tag: ${tagApollo.publicCode} / ${tagApollo.tagUid}]`);
  console.log(`3. ${patientSimba.name} (Maine Coon)       -> ${kennels[6].name} [Tag: ${tagSimba.publicCode} / ${tagSimba.tagUid}]`);
  console.log(`4. ${patientMel.name} (Siamês)           -> ${kennels[2].name} [Sem tag — pronto para vincular tag física!]`);
  console.log(`5. ${patientBob.name} (Labrador)         -> ${kennels[1].name} [Sem tag — pronto para vincular tag física!]`);
  console.log(`6. ${patientLuna.name} (Persa)            -> ${kennels[3].name} [Sem tag — pronto para vincular tag física!]`);
  console.log(`7. ${patientAmora.name} (Bulldog Francês)  -> ${kennels[5].name} [Sem tag — pronto para vincular tag física!]`);
  console.log(`8. ${patientFrida.name} (Dachshund)        -> ${kennels[7].name} [Sem tag — pronto para vincular tag física!]`);
  console.log('===================================================================');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a execução do seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

