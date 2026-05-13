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
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-2 h-[52px] flex flex-col justify-between"
          >
            <span className="text-[9px] text-slate-400 uppercase tracking-wide">{card.label}</span>
            {'isStatus' in card && card.isStatus ? (
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${'success' in card && card.success ? 'bg-green-600' : 'bg-slate-300'}`} />
                <span className={`text-[10px] font-semibold ${'success' in card && card.success ? 'text-green-600' : 'text-slate-500'}`}>
                  {card.value}
                </span>
              </div>
            ) : (
              <span className="text-xs font-semibold text-slate-900">{card.value}</span>
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
