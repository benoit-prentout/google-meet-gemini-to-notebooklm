# Dashboard Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the extension into a lightweight popup (240px, quick sync + Open Dashboard) and a full-page dashboard tab with left sidebar navigation.

**Architecture:** Two Vite entry points — `index.html` (popup, `src/App.tsx` → `src/popup/Popup.tsx`) and `dashboard.html` (`src/dashboard/main.tsx` → `src/dashboard/App.tsx` → `src/dashboard/Dashboard.tsx`). Existing tab components (History, Analytics, Settings, FileExplorer, Notifications) are reused unchanged inside the new Dashboard.

**Tech Stack:** React 18, TypeScript, Vite MPA build, Tailwind CSS v3, Zustand, Vitest + React Testing Library, Chrome MV3.

---

## File Map

| Path | Action | Responsibility |
|------|--------|---------------|
| `vite.config.ts` | Modify | Add `rollupOptions.input` with two entries |
| `tailwind.config.js` | Modify | Add `dashboard.html` to `content` array |
| `dashboard.html` | Create | Second HTML entry pointing to `src/dashboard/main.tsx` |
| `src/App.tsx` | Modify | Swap `<Dashboard />` → `<Popup />` (keep storage/wizard logic) |
| `src/popup/Popup.tsx` | Create | Popup UI: stat cards, Sync Now, Open Dashboard |
| `src/popup/Popup.test.tsx` | Create | Tests for all three Popup states |
| `src/dashboard/Dashboard.tsx` | Create | Sidebar layout + tab routing + overview panel |
| `src/dashboard/Dashboard.test.tsx` | Create | Tests for sidebar nav and tab switching |
| `src/dashboard/App.tsx` | Create | Dashboard shell: storage check + SetupWizard gate + data fetch |
| `src/dashboard/main.tsx` | Create | Dashboard ReactDOM entry |

---

## Task 1: Build System — Two Vite Entry Points

**Files:**
- Modify: `vite.config.ts`
- Modify: `tailwind.config.js`
- Create: `dashboard.html`

- [ ] **Step 1: Update `vite.config.ts` to declare both entry points**

Replace the entire file with:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      closeBundle() {
        if (!existsSync('dist')) mkdirSync('dist', { recursive: true });
        copyFileSync('public/manifest.json', 'dist/manifest.json');
        const iconsDir = 'dist/icons';
        if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
        for (const size of ['16', '48', '128']) {
          const src = `public/icons/icon${size}.png`;
          if (existsSync(src)) copyFileSync(src, `${iconsDir}/icon${size}.png`);
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

- [ ] **Step 2: Update `tailwind.config.js` to scan `dashboard.html`**

Replace with:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './dashboard.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

- [ ] **Step 3: Create `dashboard.html`**

Create at project root:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Meet Gemini to NotebookLM — Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/dashboard/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create placeholder entry so the build doesn't fail yet**

Create `src/dashboard/main.tsx`:

```typescript
// placeholder — replaced in Task 5
export {};
```

- [ ] **Step 5: Verify build succeeds with both entries**

```bash
npm run build
```

Expected: build completes, `dist/` contains both `index.html` and `dashboard.html`.

- [ ] **Step 6: Commit**

```bash
rtk git add vite.config.ts tailwind.config.js dashboard.html src/dashboard/main.tsx
rtk git commit -m "feat: add dashboard.html as second Vite entry point"
```

---

## Task 2: Popup Component

**Files:**
- Create: `src/popup/Popup.test.tsx`
- Create: `src/popup/Popup.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/popup/Popup.test.tsx`:

```typescript
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
rtk vitest run src/popup/Popup.test.tsx
```

Expected: FAIL — "Cannot find module './Popup'"

- [ ] **Step 3: Implement `src/popup/Popup.tsx`**

Create `src/popup/Popup.tsx`:

```typescript
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { useSettingsStore } from '@/store/settingsStore';

function openDashboardTab() {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
}

function formatLastSync(lastSync: string | null): string {
  if (!lastSync) return 'Never';
  const diffHrs = Math.floor((Date.now() - new Date(lastSync).getTime()) / 3_600_000);
  if (diffHrs < 1) return 'Just now';
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return new Date(lastSync).toLocaleDateString();
}

export function Popup() {
  const { isAuthenticated, signIn, signOut } = useAuth();
  const { sync } = useApi();
  const { lastSync, docSize, files, history, isLoading, settings } = useSettingsStore();

  if (!isAuthenticated) {
    return (
      <div className="w-60 p-6 flex flex-col items-center gap-4">
        <div className="w-10 h-10 bg-[#1a73e8] rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">N</span>
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-900 text-sm">Meet → NotebookLM</p>
          <p className="text-xs text-slate-500 mt-1">
            Connect your Google account to sync your meeting notes
          </p>
        </div>
        <button
          onClick={signIn}
          className="w-full bg-[#1a73e8] text-white text-sm font-semibold py-2 rounded-md"
        >
          Connect Google Account
        </button>
      </div>
    );
  }

  const notConfigured = !settings?.masterDocId || !settings?.archiveFolderId;
  const lastEvent = history[0];

  const STAT_CARDS = [
    { label: 'Last Sync', value: formatLastSync(lastSync) },
    { label: 'Doc Size', value: `${(docSize / 1024).toFixed(1)} KB` },
    { label: 'Files', value: String(files.length) },
    {
      label: 'Status',
      value: lastEvent?.status === 'success' ? 'Synced' : 'No syncs',
      isStatus: true,
      success: lastEvent?.status === 'success',
    },
  ] as const;

  return (
    <div className="w-60 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a73e8] px-4 py-3 flex items-center gap-2">
        <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center">
          <span className="text-white font-bold text-[11px]">N</span>
        </div>
        <span className="text-white font-semibold text-xs">Meet → NotebookLM</span>
      </div>

      {/* 2×2 stat grid */}
      <div className="p-3 grid grid-cols-2 gap-1.5">
        {STAT_CARDS.map(({ label, value, isStatus, success }) => (
          <div
            key={label}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-2 h-[52px] flex flex-col justify-between"
          >
            <span className="text-[9px] text-slate-400 uppercase tracking-wide">{label}</span>
            {isStatus ? (
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${success ? 'bg-green-600' : 'bg-slate-300'}`} />
                <span className={`text-[10px] font-semibold ${success ? 'text-green-600' : 'text-slate-500'}`}>
                  {value}
                </span>
              </div>
            ) : (
              <span className="text-xs font-semibold text-slate-900">{value}</span>
            )}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="px-3 pb-3 flex flex-col gap-1.5">
        <button
          onClick={sync}
          disabled={isLoading || notConfigured}
          className="w-full bg-[#1a73e8] disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-md flex items-center justify-center gap-1.5"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          Sync Now
        </button>
        <button
          onClick={openDashboardTab}
          className="w-full bg-white border border-slate-200 text-[#1a73e8] text-xs font-medium py-2 rounded-md"
        >
          Open Dashboard →
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-3 py-2 flex justify-end">
        <button onClick={signOut} className="text-[9px] text-slate-400 hover:text-slate-600">
          Sign out
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
rtk vitest run src/popup/Popup.test.tsx
```

Expected: all 6 tests PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/popup/Popup.tsx src/popup/Popup.test.tsx
rtk git commit -m "feat: add Popup component with stat cards and Open Dashboard button"
```

---

## Task 3: Wire Popup into App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace `src/App.tsx` to render `<Popup />` instead of `<Dashboard />`**

Replace the entire file with:

```typescript
import { useEffect, useState } from 'react';
import { Popup } from './popup/Popup';
import { SetupWizard } from './components/SetupWizard';
import { useAuth } from './hooks/useAuth';
import { useApi } from './hooks/useApi';
import { useSettingsStore } from './store/settingsStore';

function App() {
  const { isAuthenticated } = useAuth();
  const { getStatus, getHistory, getFiles } = useApi();
  const { deploymentUrl, setDeploymentUrl } = useSettingsStore();
  const [storageChecked, setStorageChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;
    chrome.storage.sync.get('deploymentUrl', (result) => {
      if (!isMounted) return;
      if (result.deploymentUrl) setDeploymentUrl(result.deploymentUrl as string);
      setStorageChecked(true);
    });
    return () => { isMounted = false; };
  }, [setDeploymentUrl]);

  useEffect(() => {
    if (isAuthenticated) {
      getStatus().catch(console.error);
      getHistory().catch(console.error);
      getFiles().catch(console.error);
    }
    // API functions are stable refs; re-fetch only on auth change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (!storageChecked) {
    return (
      <div className="flex items-center justify-center h-24 w-60">
        <span className="text-sm text-slate-500">Loading…</span>
      </div>
    );
  }

  if (!deploymentUrl) {
    return <SetupWizard />;
  }

  return <Popup />;
}

export default App;
```

- [ ] **Step 2: Run full test suite to ensure nothing regressed**

```bash
rtk vitest run
```

Expected: all 23+ tests PASS (SetupWizard tests still pass because `src/App.tsx` still uses `<SetupWizard />`)

- [ ] **Step 3: Commit**

```bash
rtk git add src/App.tsx
rtk git commit -m "feat: wire App.tsx to render Popup instead of Dashboard"
```

---

## Task 4: Dashboard Component

**Files:**
- Create: `src/dashboard/Dashboard.test.tsx`
- Create: `src/dashboard/Dashboard.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/dashboard/Dashboard.test.tsx`:

```typescript
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
    await userEvent.click(screen.getByRole('button', { name: /settings/i }));
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
rtk vitest run src/dashboard/Dashboard.test.tsx
```

Expected: FAIL — "Cannot find module './Dashboard'"

- [ ] **Step 3: Implement `src/dashboard/Dashboard.tsx`**

Create `src/dashboard/Dashboard.tsx`:

```typescript
import { useState } from 'react';
import {
  RefreshCw,
  History as HistoryIcon,
  BarChart3,
  FolderOpen,
  Settings as SettingsIcon,
} from 'lucide-react';
import { History } from '@/components/History';
import { Analytics } from '@/components/Analytics';
import { Settings } from '@/components/Settings';
import { FileExplorer } from '@/components/FileExplorer';
import { Notifications } from '@/components/Notifications';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { useSettingsStore } from '@/store/settingsStore';

type Tab = 'overview' | 'history' | 'analytics' | 'files' | 'settings';

function formatLastSync(lastSync: string | null): string {
  if (!lastSync) return 'Never';
  const diffHrs = Math.floor((Date.now() - new Date(lastSync).getTime()) / 3_600_000);
  if (diffHrs < 1) return 'Just now';
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return new Date(lastSync).toLocaleDateString();
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { signOut } = useAuth();
  const { sync } = useApi();
  const { lastSync, docSize, files, history, isLoading, settings } = useSettingsStore();

  const notConfigured = !settings?.masterDocId || !settings?.archiveFolderId;
  const lastEvent = history[0];

  const STAT_CARDS = [
    { label: 'Last Sync', value: formatLastSync(lastSync) },
    { label: 'Doc Size', value: `${(docSize / 1024).toFixed(1)} KB` },
    { label: 'Files Synced', value: String(files.length) },
    {
      label: 'Status',
      value: lastEvent?.status === 'success' ? 'Synced' : 'No syncs',
      isStatus: true,
      success: lastEvent?.status === 'success',
    },
  ] as const;

  const NAV_MAIN: { id: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', Icon: RefreshCw },
    { id: 'history', label: 'History', Icon: HistoryIcon },
    { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
    { id: 'files', label: 'Files', Icon: FolderOpen },
  ];

  const navItemClass = (id: Tab) =>
    `flex items-center gap-2 px-4 py-1.5 text-xs text-left w-full transition-colors ${
      activeTab === id
        ? 'bg-blue-50 border-r-2 border-[#1a73e8] text-[#1a73e8] font-semibold'
        : 'text-slate-500 hover:bg-slate-50'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="h-12 bg-white border-b border-slate-200 flex items-center px-5 gap-3 shrink-0">
        <div className="w-6 h-6 bg-[#1a73e8] rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-xs">N</span>
        </div>
        <span className="font-semibold text-slate-900 text-sm">Meet → NotebookLM</span>
        <div className="ml-auto flex items-center gap-3">
          {lastEvent?.status === 'success' && (
            <span className="bg-green-50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              ● Synced
            </span>
          )}
          <button onClick={signOut} className="text-xs text-slate-400 hover:text-slate-600">
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-40 bg-white border-r border-slate-200 flex flex-col py-3 shrink-0">
          {NAV_MAIN.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={navItemClass(id)}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={() => setActiveTab('settings')} className={navItemClass('settings')}>
            <SettingsIcon className="w-3.5 h-3.5" />
            Settings
          </button>
        </nav>

        {/* Content */}
        <main className="flex-1 p-5 overflow-auto">
          {notConfigured && activeTab !== 'settings' && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <span className="text-amber-700 text-xs flex-1">
                Please configure your Master Doc ID and Archive Folder in Settings to enable syncing.
              </span>
              <button
                onClick={() => setActiveTab('settings')}
                className="text-xs font-semibold text-[#1a73e8] whitespace-nowrap"
              >
                Go to Settings
              </button>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="flex flex-col gap-4">
              {/* 4-column stat row */}
              <div className="grid grid-cols-4 gap-3">
                {STAT_CARDS.map(({ label, value, isStatus, success }) => (
                  <div
                    key={label}
                    className="bg-white border border-slate-200 rounded-lg p-3.5 h-[70px] flex flex-col justify-between"
                  >
                    <span className="text-[9px] text-slate-400 uppercase tracking-wide">{label}</span>
                    {isStatus ? (
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${success ? 'bg-green-600' : 'bg-slate-300'}`} />
                        <span className={`text-sm font-bold ${success ? 'text-green-600' : 'text-slate-500'}`}>
                          {value}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-slate-900">{value}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick Actions + Recent Activity */}
              <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 2fr' }}>
                <div className="bg-white border border-slate-200 rounded-lg p-4 h-[90px] flex flex-col justify-between">
                  <span className="text-xs font-semibold text-slate-900">Quick Actions</span>
                  <button
                    onClick={sync}
                    disabled={isLoading || notConfigured}
                    className="bg-[#1a73e8] disabled:opacity-50 text-white text-xs font-semibold py-1.5 rounded-md flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    Sync Now
                  </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4 h-[90px]">
                  <p className="text-xs font-semibold text-slate-900 mb-2">Recent Activity</p>
                  {lastEvent ? (
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-600">{lastEvent.message}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(lastEvent.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No recent activity</p>
                  )}
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-900 mb-2">Notifications</p>
                <Notifications compact />
              </div>
            </div>
          )}

          {activeTab === 'history' && <History />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'files' && <FileExplorer />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
rtk vitest run src/dashboard/Dashboard.test.tsx
```

Expected: all 9 tests PASS

- [ ] **Step 5: Run full test suite**

```bash
rtk vitest run
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
rtk git add src/dashboard/Dashboard.tsx src/dashboard/Dashboard.test.tsx
rtk git commit -m "feat: add Dashboard component with sidebar navigation and overview panel"
```

---

## Task 5: Dashboard Shell + Final Build Verification

**Files:**
- Create: `src/dashboard/App.tsx`
- Modify: `src/dashboard/main.tsx` (replace placeholder)

- [ ] **Step 1: Create `src/dashboard/App.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { Dashboard } from './Dashboard';
import { SetupWizard } from '@/components/SetupWizard';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { useSettingsStore } from '@/store/settingsStore';

function App() {
  const { isAuthenticated } = useAuth();
  const { getStatus, getHistory, getFiles } = useApi();
  const { setDeploymentUrl } = useSettingsStore();
  const [storageChecked, setStorageChecked] = useState(false);
  const [hasDeploymentUrl, setHasDeploymentUrl] = useState(false);

  useEffect(() => {
    let isMounted = true;
    chrome.storage.sync.get('deploymentUrl', (result) => {
      if (!isMounted) return;
      if (result.deploymentUrl) {
        setDeploymentUrl(result.deploymentUrl as string);
        setHasDeploymentUrl(true);
      }
      setStorageChecked(true);
    });
    return () => { isMounted = false; };
  }, [setDeploymentUrl]);

  useEffect(() => {
    if (isAuthenticated) {
      getStatus().catch(console.error);
      getHistory().catch(console.error);
      getFiles().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (!storageChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-sm text-slate-500">Loading…</span>
      </div>
    );
  }

  if (!hasDeploymentUrl) {
    return <SetupWizard />;
  }

  return <Dashboard />;
}

export default App;
```

- [ ] **Step 2: Replace placeholder `src/dashboard/main.tsx` with the real entry**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 3: Run full test suite one final time**

```bash
rtk vitest run
```

Expected: all tests PASS

- [ ] **Step 4: Build and verify both HTML files are in dist/**

```bash
npm run build && ls dist/*.html
```

Expected output includes:
```
dist/index.html
dist/dashboard.html
```

- [ ] **Step 5: Commit**

```bash
rtk git add src/dashboard/App.tsx src/dashboard/main.tsx
rtk git commit -m "feat: add dashboard shell and entry point — redesign complete"
```

---

## Manual Verification Checklist

After loading `dist/` as unpacked extension in Chrome:

1. **Popup** — click extension icon → 240px popup with blue header, 2×2 stat cards, Sync Now, Open Dashboard →
2. **Open Dashboard button** → opens a new Chrome tab with the full dashboard
3. **Sidebar navigation** → clicking Overview / History / Analytics / Files / Settings switches content
4. **Settings pin** → Settings nav item appears at the bottom of the sidebar
5. **Unconfigured banner** → shows if masterDocId or archiveFolderId not set, dismissed on Settings tab
6. **Sign out** → works from both popup footer and dashboard top bar
