import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { SetupWizard } from './components/SetupWizard';
import { useAuth } from './hooks/useAuth';
import { useApi } from './hooks/useApi';
import { useSettingsStore } from './store/settingsStore';

function App() {
  const { isAuthenticated } = useAuth();
  const { getStatus, getHistory, getFiles } = useApi();
  const { deploymentUrl, setDeploymentUrl } = useSettingsStore();
  const [storageChecked, setStorageChecked] = useState(false);

  // On mount, read deploymentUrl from chrome.storage.sync and hydrate the store
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
    // API functions from useApi are stable refs (useCallback with [accessToken] deps).
    // Re-fetch only when auth state changes; accessToken changes with isAuthenticated in the same render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Wait until we've checked storage before rendering
  if (!storageChecked) {
    return (
      <div className="flex items-center justify-center h-24 w-96">
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // No deployment URL configured yet — show setup wizard
  if (!deploymentUrl) {
    return <SetupWizard />;
  }

  // Deployment URL exists — show Dashboard (which handles its own sign-in UI if not authenticated)
  return <Dashboard />;
}

export default App;
