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
  }, [isAuthenticated, getStatus, getHistory, getFiles]);
  
  return <Dashboard />;
}

export default App;