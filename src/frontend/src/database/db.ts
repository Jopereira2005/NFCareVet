import Dexie, { type EntityTable } from 'dexie';

// Exemplo inicial de uma tabela baseada no contexto do sistema
export interface Patient {
  id?: number;
  name: string;
  species: string;
  status: string;
  createdAt: string;
}

// Criação da instância do banco de dados
const db = new Dexie('NFCareVetDatabase') as Dexie & {
  patients: EntityTable<
    Patient,
    'id' // chave primária
  >;
};

// Declaração do schema (tabelas e seus índices de busca)
db.version(1).stores({
  patients: '++id, name, species, status' 
});

export { db };
