import { useSettingsStore } from '@/store/settingsStore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export function Analytics() {
  const { history, docSize } = useSettingsStore();
  
  const totalSyncs = history.length;
  const totalFilesProcessed = history.reduce((sum, e) => sum + e.filesProcessed, 0);
  const avgFilesPerSync = totalSyncs > 0 ? (totalFilesProcessed / totalSyncs).toFixed(1) : '0';
  
  const syncsByDate = history.reduce((acc, event) => {
    const date = new Date(event.timestamp).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const syncFrequencyData = Object.entries(syncsByDate)
    .map(([date, count]) => ({ date, count }))
    .slice(-7);
  
  const syncsByMonth = history.reduce((acc, event) => {
    const month = new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + event.filesProcessed;
    return acc;
  }, {} as Record<string, number>);
  
  const monthlyData = Object.entries(syncsByMonth)
    .map(([month, files]) => ({ month, files }))
    .slice(-6);
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics</h2>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Syncs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSyncs}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Files Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalFilesProcessed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Files / Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgFilesPerSync}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sync Frequency (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {syncFrequencyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={syncFrequencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Files (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="files"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Document Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Current Size</p>
              <p className="text-2xl font-bold">{(docSize / 1024).toFixed(1)} KB</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Size Limit</p>
              <p className="text-2xl font-bold">{(800000 / 1024).toFixed(0)} KB</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
