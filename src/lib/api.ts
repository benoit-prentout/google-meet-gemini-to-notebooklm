import type { ApiResponse, StatusResponse, Settings, SyncEvent, SyncFile } from '@/types';

const DEPLOYMENT_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<T> {
  const url = `${DEPLOYMENT_URL}?action=${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    throw new ApiError(`API request failed: ${response.statusText}`, response.status);
  }
  
  const data: ApiResponse<T> = await response.json();
  
  if (!data.success) {
    throw new ApiError(data.error || 'Unknown error');
  }
  
  return data as T;
}

export const api = {
  getStatus: (accessToken: string) =>
    fetchApi<StatusResponse>('status', { method: 'GET' }, accessToken),
  
  sync: (accessToken: string) =>
    fetchApi<{ result: unknown }>('sync', { method: 'POST' }, accessToken),
  
  archive: (accessToken: string) =>
    fetchApi<{ result: unknown }>('archive', { method: 'POST' }, accessToken),
  
  getHistory: (accessToken: string) =>
    fetchApi<{ history: SyncEvent[] }>('history', { method: 'GET' }, accessToken),
  
  getSettings: (accessToken: string) =>
    fetchApi<{ settings: Settings }>('settings', { method: 'GET' }, accessToken),
  
  updateSettings: (accessToken: string, settings: Partial<Settings>) =>
    fetchApi<{ message: string }>('settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    }, accessToken),
  
  getFiles: (accessToken: string) =>
    fetchApi<{ files: SyncFile[] }>('files', { method: 'GET' }, accessToken),
};
