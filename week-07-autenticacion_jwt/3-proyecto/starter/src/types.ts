// ============================================
// TYPES — Contratos de respuesta genéricos
// ============================================

export interface SingleResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface ValidationErrorResponse extends ErrorResponse {
  issues: { path: string; message: string }[];
}

export interface PaginationParams {
  page: number;
  limit: number;
}

// El usuario tal como sale hacia el cliente: sin password ni refreshToken.
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt?: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
