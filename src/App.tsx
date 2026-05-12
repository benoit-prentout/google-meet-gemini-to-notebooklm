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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // API functions are useCallback refs that may be recreated on store updates;
    // intentionally depend only on isAuthenticated to avoid re-run loops.
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps
  
  return <Dashboard />;
}

export default App;