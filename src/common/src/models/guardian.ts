export interface IGuardian {
  id: string;
  name: string;
  cpf?: string | null;
  email?: string | null;
  phone: string;
  address?: string | null;
  isActive?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ICreateGuardianPayload {
  name: string;
  phone: string;
  cpf?: string;
  email?: string;
  address?: string;
}

export interface IUpdateGuardianPayload {
  name?: string;
  phone?: string;
  cpf?: string;
  email?: string;
  address?: string;
}
