import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useSettingsStore } from '@/store/settingsStore';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface NotificationsProps {
  compact?: boolean;
}

export function Notifications({ compact = false }: NotificationsProps) {
  const { error, isLoading, settings } = useSettingsStore();

  const notConfigured = !settings?.masterDocId || !settings?.archiveFolderId;

  if (compact) {
    return (
      <div className="space-y-2">
        {error && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-blue-600">
            <AlertCircle className="w-4 h-4 animate-pulse" />
            <span className="text-sm">Syncing...</span>
          </div>
        )}
        {notConfigured && !error && !isLoading && (
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Configuration required</span>
          </div>
        )}
        {!error && !isLoading && !notConfigured && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">All systems operational</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error ? (
            <div className="flex items-start gap-2 text-red-600">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center gap-2 text-blue-600">
              <AlertCircle className="w-5 h-5 animate-pulse" />
              <span>Syncing in progress...</span>
            </div>
          ) : notConfigured ? (
            <div className="flex items-start gap-2 text-yellow-600">
              <AlertTriangle className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">Configuration Required</p>
                <p className="text-sm">Please configure Master Doc ID and Archive Folder</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span>All systems operational</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}