import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useSettingsStore } from '@/store/settingsStore';
import { FileText } from 'lucide-react';

export function FileExplorer() {
  const { files } = useSettingsStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Synced Files</CardTitle>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="text-muted-foreground">No files synced yet</p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    Last synced:
                  </p>
                  <p className="text-xs">
                    {new Date(file.lastSynced).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}