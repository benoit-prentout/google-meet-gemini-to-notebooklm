import { useEffect, useState } from 'react';
import { Popup } from './popup/Popup';
import { SetupWizard } from './components/SetupWizard';
import { useAuth } from './hooks/useAuth';
import { useApi } from './hooks/useApi';
import { useSettingsStore } from './store/settingsStore';

function App() {
  const { isAuthenticated } = useAuth();
  const { getStatus, getHistory, getFiles } = useApi();
  const { deploymentUrl, setDeploymentUrl } = useSettingsStore();
  const [storageChecked, setStorageChecked] = useState(false);

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
    // API functions are stable refs; re-fetch only on auth change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (!storageChecked) {
    return (
      <div className="flex items-center justify-center h-24 w-60">
        <span className="text-sm text-slate-500">Loading…</span>
      </div>
    );
  }

  if (!deploymentUrl) {
    return <SetupWizard />;
  }

  return <Popup />;
}

export default App;
