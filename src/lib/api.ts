import type { ApiResponse, Settings } from '@/types';

const API_BASE = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

async function request<T>(endpoint: string, token: string): Promise<T> {
  const response = await fetch(`${API_BASE}?action=${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  return response.json() as Promise<T>;
}

export const api = {
  getSettings: (token: string) => request<ApiResponse<Settings>>('getSettings', token),
  
  saveSettings: (token: string, _settings: Settings) =>
    request<ApiResponse>('saveSettings', token),
};
