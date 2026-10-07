import { useEffect, useState } from 'react';

import { resolveRoute } from '@/router';

function App() {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname);

    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const currentRoute = resolveRoute(currentPath);
  const CurrentComponent = currentRoute.component;

  return (<CurrentComponent />);
}

export default App;
