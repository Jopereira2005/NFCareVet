export interface INfcTag {
  id: string;
  tagUid: string;
  publicCode: string;
  active: boolean;
  createdAt: Date | string;
}

export interface ICreateNfcTagPayload {
  tagUid: string;
  publicCode: string;
  active?: boolean;
}
