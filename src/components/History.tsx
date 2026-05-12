import { useSettingsStore } from '@/store/settingsStore';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export function History() {
  const { history } = useSettingsStore();
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Sync History</h2>
      
      {history.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No sync history yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((event) => (
            <Card key={event.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-shrink-0">
                  {event.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {event.status === 'partial' && (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  {event.status === 'error' && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{event.message}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
                
                <Badge
                  variant={
                    event.status === 'success'
                      ? 'success'
                      : event.status === 'partial'
                      ? 'warning'
                      : 'destructive'
                  }
                >
                  {event.filesProcessed} files
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
