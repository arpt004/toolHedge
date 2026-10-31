import { useEffect, useState } from 'react';
import { adminApi } from './api';
import { AdminUser } from './types';

// Used outside the /admin tree (e.g. the public PDP) to decide whether to
// show admin-only controls, without pulling in the full AdminAuthProvider.
export function useOptionalAdminSession() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  useEffect(() => {
    let active = true;
    adminApi
      .me()
      .then(({ admin: current }) => {
        if (active) setAdmin(current);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  return admin;
}
