export interface IGuardian {
  id: string;
  name: string;
  cpf?: string | null;
  email?: string | null;
  phone: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ICreateGuardianPayload {
  name: string;
  phone: string;
  cpf?: string;
  email?: string;
}

export interface IUpdateGuardianPayload {
  name?: string;
  phone?: string;
  cpf?: string;
  email?: string;
}
