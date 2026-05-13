import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from './Dashboard';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
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

vi.mock('@/components/History', () => ({ History: () => <div>History content</div> }));
vi.mock('@/components/Analytics', () => ({ Analytics: () => <div>Analytics content</div> }));
vi.mock('@/components/Settings', () => ({ Settings: () => <div>Settings content</div> }));
vi.mock('@/components/FileExplorer', () => ({ FileExplorer: () => <div>Files content</div> }));
vi.mock('@/components/Notifications', () => ({
  Notifications: () => <div>Notifications content</div>,
}));

describe('Dashboard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders all five sidebar nav buttons', () => {
    render(<Dashboard />);
    expect(screen.getByRole('button', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analytics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /files/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('shows Overview content by default', () => {
    render(<Dashboard />);
    expect(screen.getByText('Last Sync')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('shows all four stat card labels on Overview', () => {
    render(<Dashboard />);
    expect(screen.getByText('Last Sync')).toBeInTheDocument();
    expect(screen.getByText('Doc Size')).toBeInTheDocument();
    expect(screen.getByText('Files Synced')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('switches to History when History nav button is clicked', async () => {
    render(<Dashboard />);
    await userEvent.click(screen.getByRole('button', { name: /history/i }));
    expect(screen.getByText('History content')).toBeInTheDocument();
  });

  it('switches to Analytics when Analytics nav button is clicked', async () => {
    render(<Dashboard />);
    await userEvent.click(screen.getByRole('button', { name: /analytics/i }));
    expect(screen.getByText('Analytics content')).toBeInTheDocument();
  });

  it('switches to Settings when Settings nav button is clicked', async () => {
    render(<Dashboard />);
    await userEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(screen.getByText('Settings content')).toBeInTheDocument();
  });

  it('shows unconfigured warning banner on Overview when settings are missing', async () => {
    const { useSettingsStore } = await import('@/store/settingsStore');
    (useSettingsStore as ReturnType<typeof vi.fn>).mockReturnValue({
      lastSync: null,
      docSize: 0,
      files: [],
      history: [],
      isLoading: false,
      settings: null,
    });
    render(<Dashboard />);
    expect(screen.getByText(/configure/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to settings/i })).toBeInTheDocument();
  });

  it('hides unconfigured banner when Settings tab is active', async () => {
    const { useSettingsStore } = await import('@/store/settingsStore');
    (useSettingsStore as ReturnType<typeof vi.fn>).mockReturnValue({
      lastSync: null,
      docSize: 0,
      files: [],
      history: [],
      isLoading: false,
      settings: null,
    });
    render(<Dashboard />);
    // When the banner is showing, multiple buttons match /settings/i (nav + banner).
    // Click the first one (the sidebar nav Settings button).
    const settingsButtons = screen.getAllByRole('button', { name: /settings/i });
    await userEvent.click(settingsButtons[0]);
    expect(screen.queryByRole('button', { name: /go to settings/i })).not.toBeInTheDocument();
  });

  it('clicking Go to Settings banner button switches to Settings tab', async () => {
    const { useSettingsStore } = await import('@/store/settingsStore');
    (useSettingsStore as ReturnType<typeof vi.fn>).mockReturnValue({
      lastSync: null,
      docSize: 0,
      files: [],
      history: [],
      isLoading: false,
      settings: null,
    });
    render(<Dashboard />);
    await userEvent.click(screen.getByRole('button', { name: /go to settings/i }));
    expect(screen.getByText('Settings content')).toBeInTheDocument();
  });
});
