import { useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { useAuth } from './hooks/useAuth';
import { useApi } from './hooks/useApi';

function App() {
  const { isAuthenticated } = useAuth();
  const { getStatus, getHistory, getFiles } = useApi();
  
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
  
  return <Dashboard />;
}

export default App;