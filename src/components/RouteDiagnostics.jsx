import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteDiagnostics() {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.info(`[KRISHOK-SHEBA] Route loaded: ${location.pathname}${location.search}`);
    }
  }, [location.pathname, location.search]);

  return null;
}
