import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Popup } from './Popup';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock('@/hooks/useApi', () => ({
  useApi: vi.fn(() => ({ sync: vi.fn() })),
}));

vi.mock('@/store/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    lastSync: null,
    docSize: 0,
    files: [],
    history: [],
    isLoading: false,
    settings: { masterDocId: 'doc123', archiveFolderId: 'folder123' },
  })),
}));

describe('Popup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (chrome.tabs.create as ReturnType<typeof vi.fn>).mockReset();
    (chrome.runtime as unknown as Record<string, unknown>).getURL =
      vi.fn().mockReturnValue('chrome-extension://abc/dashboard.html');
  });

  it('shows Connect Google Account when not authenticated', () => {
    render(<Popup />);
    expect(
      screen.getByRole('button', { name: /connect google account/i })
    ).toBeInTheDocument();
  });

  it('calls signIn when Connect button is clicked', async () => {
    const signIn = vi.fn();
    const { useAuth } = await import('@/hooks/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      signIn,
      signOut: vi.fn(),
    });
    render(<Popup />);
    await userEvent.click(screen.getByRole('button', { name: /connect google account/i }));
    expect(signIn).toHaveBeenCalled();
  });

  it('shows all four stat cards when authenticated', async () => {
    const { useAuth } = await import('@/hooks/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    render(<Popup />);
    expect(screen.getByText('Last Sync')).toBeInTheDocument();
    expect(screen.getByText('Doc Size')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('opens dashboard tab when Open Dashboard is clicked', async () => {
    const { useAuth } = await import('@/hooks/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    render(<Popup />);
    await userEvent.click(screen.getByRole('button', { name: /open dashboard/i }));
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://abc/dashboard.html',
    });
  });

  it('disables Sync Now when settings are not configured', async () => {
    const { useAuth } = await import('@/hooks/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    const { useSettingsStore } = await import('@/store/settingsStore');
    (useSettingsStore as ReturnType<typeof vi.fn>).mockReturnValue({
      lastSync: null,
      docSize: 0,
      files: [],
      history: [],
      isLoading: false,
      settings: null,
    });
    render(<Popup />);
    expect(screen.getByRole('button', { name: /sync now/i })).toBeDisabled();
  });

  it('calls signOut when Sign out is clicked', async () => {
    const signOut = vi.fn();
    const { useAuth } = await import('@/hooks/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut,
    });
    render(<Popup />);
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(signOut).toHaveBeenCalled();
  });
});
