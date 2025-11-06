// Common types cho backend

export interface PaymentCallbackBody {
  vnp_TxnRef?: string;
  vnp_Amount?: string;
  vnp_OrderInfo?: string;
  vnp_ResponseCode?: string;
  vnp_TransactionNo?: string;
  vnp_BankCode?: string;
  vnp_PayDate?: string;
  vnp_SecureHash?: string;
  [key: string]: string | undefined;
}

export interface LocationData {
  country?: string;
  province?: string;
  district?: string;
  ward?: string;
  address?: string;
  detail_address?: string;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  geo?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface AddressCacheItem {
  ts: number;
  result: {
    normalized: string;
    detail_address: string;
    ward: string;
    district: string;
    province: string;
    confidence: number;
  };
}

export interface CustomField {
  name?: string; // Tên field (legacy)
  label: string;
  value?: string | number | boolean; // Optional vì khi tạo template chưa có value
  type?: 'text' | 'number' | 'boolean' | 'select' | 'checkbox' | 'radio';
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface GeminiImagePart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

export interface GeminiTextPart {
  text: string;
}

export type GeminiPart = GeminiTextPart | GeminiImagePart;
