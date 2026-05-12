import type { ApiResponse, StatusResponse, Settings, SyncEvent, SyncFile } from '@/types';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getDeploymentUrl(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('deploymentUrl', (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (result.deploymentUrl) {
        resolve(result.deploymentUrl as string);
      } else {
        reject(new Error('Deployment URL not configured. Please complete setup first.'));
      }
    });
  });
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<T> {
  const base = await getDeploymentUrl();
  const url = new URL(base);
  url.searchParams.set('action', endpoint);
  if (accessToken) {
    url.searchParams.set('token', accessToken);
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
    },
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
