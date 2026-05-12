import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useSettingsStore } from '@/store/settingsStore';

export function Analytics() {
  const { history, lastSync, docSize } = useSettingsStore();

  const totalSyncs = history.length;
  const totalFiles = history.reduce((sum, e) => sum + e.filesProcessed, 0);
  const avgFiles = totalSyncs > 0 ? (totalFiles / totalSyncs).toFixed(1) : '0';

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total Syncs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalSyncs}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Files Processed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalFiles}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Files/Sync</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{avgFiles}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Last Sync</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">
            {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Size</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{((docSize ?? 0) / 1024).toFixed(1)} KB</p>
        </CardContent>
      </Card>
    </div>
  );
}