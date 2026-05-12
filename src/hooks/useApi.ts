import { useCallback } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { api } from '@/lib/api';

export function useApi() {
  const { accessToken, setLoading, setError, setStatus, setHistory, setFiles } = useSettingsStore();

  const getStatus = useCallback(async () => {
    if (!accessToken) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);

    try {
      const response = await api.getStatus(accessToken);
      setStatus(response.lastSync || '', response.docSize);
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get status');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [accessToken, setLoading, setError, setStatus]);

  const sync = useCallback(async () => {
    if (!accessToken) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);

    try {
      const response = await api.sync(accessToken);
      await getStatus();
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Sync failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [accessToken, setLoading, setError, getStatus]);

  const archive = useCallback(async () => {
    if (!accessToken) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);

    try {
      const response = await api.archive(accessToken);
      await getStatus();
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Archive failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [accessToken, setLoading, setError, getStatus]);

  const getHistory = useCallback(async () => {
    if (!accessToken) throw new Error('Not authenticated');

    try {
      const response = await api.getHistory(accessToken);
      setHistory(response.history ?? []);
      return response.history;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get history');
      throw error;
    }
  }, [accessToken, setHistory, setError]);

  const getFiles = useCallback(async () => {
    if (!accessToken) throw new Error('Not authenticated');

    try {
      const response = await api.getFiles(accessToken);
      setFiles(response.files ?? []);
      return response.files;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get files');
      throw error;
    }
  }, [accessToken, setFiles, setError]);

  const updateSettings = useCallback(async (settings: Parameters<typeof api.updateSettings>[1]) => {
    if (!accessToken) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);

    try {
      const response = await api.updateSettings(accessToken, settings);
      await getStatus();
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update settings');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [accessToken, setLoading, setError, getStatus]);

  return {
    getStatus,
    sync,
    archive,
    getHistory,
    getFiles,
    updateSettings,
  };
}