export interface IKennel {
  id: string;
  name: string;
  notes?: string | null;
  isActive: boolean;
  createdAt: Date | string;
}

export interface ICreateKennelPayload {
  name: string;
  notes?: string;
  isActive?: boolean;
}

export interface IUpdateKennelPayload {
  name?: string;
  notes?: string;
  isActive?: boolean;
}
