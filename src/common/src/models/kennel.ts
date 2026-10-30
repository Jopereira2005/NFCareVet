export interface IKennelOccupant {
  patientId: string;
  patientName: string;
}

export interface IKennel {
  id: string;
  name: string;
  notes?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  occupant?: IKennelOccupant | null;
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
