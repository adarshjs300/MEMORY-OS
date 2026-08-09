import { apiClient } from './client';

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

export async function registerRequest(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/register', input);
  return data;
}

export async function loginRequest(input: { email: string; password: string }): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/login', input);
  return data;
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post('/api/auth/logout');
}

export async function meRequest(): Promise<{ user: PublicUser }> {
  const { data } = await apiClient.get<{ user: PublicUser }>('/api/auth/me');
  return data;
}
