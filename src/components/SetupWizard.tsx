import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SetupWizard() {
  const { signIn } = useAuth();
  const { setDeploymentUrl } = useSettingsStore();
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateUrl(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return 'Deployment URL is required';
    if (!trimmed.startsWith('https://script.google.com/')) {
      return 'URL must start with https://script.google.com/';
    }
    return null;
  }

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setUrl(value);
    setUrlError(validateUrl(value));
  }

  async function handleSave() {
    const validationError = validateUrl(url);
    if (validationError) {
      setUrlError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    useSettingsStore.getState().setError(null);
    try {
      await new Promise<void>((resolve, reject) => {
        chrome.storage.sync.set({ deploymentUrl: url.trim() }, () => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve();
        });
      });
      setDeploymentUrl(url.trim());
      await signIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 w-96">
      <Card>
        <CardHeader>
          <CardTitle>Setup Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your Apps Script deployment URL to get started.
          </p>
          <div className="space-y-2">
            <Label htmlFor="deployment-url">Apps Script Deployment URL</Label>
            <Input
              id="deployment-url"
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={url}
              onChange={handleUrlChange}
              disabled={saving}
            />
            {urlError && (
              <p className="text-sm text-destructive">{urlError}</p>
            )}
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || !!urlError || !url}
            className="w-full"
          >
            {saving ? 'Connecting...' : 'Save & Connect'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Need help?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.open(
                  'https://github.com/benoit-prentout/google-meet-gemini-to-notebooklm/blob/main/docs/google-cloud-setup.md',
                  '_blank'
                );
              }}
              className="underline"
            >
              See the setup guide
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
