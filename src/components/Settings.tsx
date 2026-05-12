import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { useSettingsStore } from '@/store/settingsStore';
import { useApi } from '@/hooks/useApi';
import { Save } from 'lucide-react';

export function Settings() {
  const { settings, updateSetting } = useSettingsStore();
  const { updateSettings } = useApi();
  const [saving, setSaving] = useState(false);

  if (!settings) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Settings not loaded</p>
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Google Drive Configuration</CardTitle>
          <CardDescription>
            Configure your Google Drive folders and document IDs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="masterDocId">Master Document ID</Label>
            <Input
              id="masterDocId"
              value={settings.masterDocId || ''}
              onChange={(e) => updateSetting('masterDocId', e.target.value)}
              placeholder="Enter Google Doc ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="archiveFolderId">Archive Folder ID</Label>
            <Input
              id="archiveFolderId"
              value={settings.archiveFolderId || ''}
              onChange={(e) => updateSetting('archiveFolderId', e.target.value)}
              placeholder="Enter Google Drive Folder ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sourceFolderName">Source Folder Name</Label>
            <Input
              id="sourceFolderName"
              value={settings.sourceFolderName || ''}
              onChange={(e) => updateSetting('sourceFolderName', e.target.value)}
              placeholder="Meet Notes"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sync Settings</CardTitle>
          <CardDescription>
            Configure sync behavior and limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Update Detection</Label>
              <p className="text-sm text-muted-foreground">
                Check for file modifications
              </p>
            </div>
            <Switch
              checked={settings.enableUpdateDetection}
              onClick={() => updateSetting('enableUpdateDetection', !settings.enableUpdateDetection)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Monthly Archive</Label>
              <p className="text-sm text-muted-foreground">
                Automatically archive monthly
              </p>
            </div>
            <Switch
              checked={settings.enableMonthlyArchive}
              onClick={() => updateSetting('enableMonthlyArchive', !settings.enableMonthlyArchive)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxFilesPerRun">Max Files Per Run</Label>
              <Input
                id="maxFilesPerRun"
                type="number"
                value={settings.maxFilesPerRun}
                onChange={(e) => updateSetting('maxFilesPerRun', parseInt(e.target.value) || 10)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAgeDays">Max Age (Days)</Label>
              <Input
                id="maxAgeDays"
                type="number"
                value={settings.maxAgeDays}
                onChange={(e) => updateSetting('maxAgeDays', parseInt(e.target.value) || 30)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}