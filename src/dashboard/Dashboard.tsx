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
                {STAT_CARDS.map((card) => (
                  <div
                    key={card.label}
                    className="bg-white border border-slate-200 rounded-lg p-3.5 h-[70px] flex flex-col justify-between"
                  >
                    <span className="text-[9px] text-slate-400 uppercase tracking-wide">{card.label}</span>
                    {'isStatus' in card && card.isStatus ? (
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${'success' in card && card.success ? 'bg-green-600' : 'bg-slate-300'}`} />
                        <span className={`text-sm font-bold ${'success' in card && card.success ? 'text-green-600' : 'text-slate-500'}`}>
                          {card.value}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-slate-900">{card.value}</span>
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
