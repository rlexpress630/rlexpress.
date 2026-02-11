export enum DeliveryStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED'
}

export interface Address {
  fullAddress: string;
  cep: string;
  city?: string;
  notes?: string;
  lat?: number;
  lng?: number;
}

export interface Delivery {
  id: string;
  customerName: string;
  phone: string;
  address: Address;
  status: DeliveryStatus;
  createdAt: number;
  completedAt?: number;
  proof?: {
    photoUrl?: string; // Base64 or URL
    signatureUrl?: string; // Base64 signature image
    receiverName: string;
    receiverDoc: string; // CPF or RG
    receiverRelationship?: string; // e.g., Titular, Parente, Porteiro
    notes?: string;
  };
  distance?: string; // Estimated
  time?: string; // Estimated
}

export interface GeminiOCRResponse {
  customerName: string;
  phone: string;
  fullAddress: string;
  cep: string;
  city: string;
  complement?: string;
  lat?: number;
  lng?: number;
}