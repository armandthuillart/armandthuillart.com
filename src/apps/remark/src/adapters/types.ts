export interface Account {
  accountId?: string;
  createdAt: Date;
  id: string;
  provider?: string;
  providerId: string;
  userId: string;
}
export interface Passkey {
  createdAt: Date;
  credentialID: string;
  id: string;
  name?: string;
}
