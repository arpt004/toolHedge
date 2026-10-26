import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../api';

// A single, reusable column-visibility system: callers pass a tableKey and
// the set of all/default columns; this hook owns loading the admin's saved
// preference, persisting changes, and falling back gracefully (to the
// caller-provided defaults) whenever the backend can't be reached, so a
// transient network failure never blocks the table from rendering.
export function useColumnPreferences(tableKey: string, allKeys: string[], defaultKeys: string[]) {
  const [visible, setVisible] = useState<string[]>(defaultKeys);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    let active = true;
    adminApi
      .getColumnPreferences(tableKey)
      .then(({ columns }) => {
        if (!active) return;
        if (columns && columns.length) {
          setVisible(columns.filter((key) => allKeys.includes(key)));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableKey]);

  // Persists a column list: updates local state immediately (so the table
  // reflects the change right away) and saves it to the backend
  // separately, never from inside another state updater.
  const persist = useCallback(
    (next: string[]) => {
      setVisible(next);
      adminApi
        .saveColumnPreferences(tableKey, next)
        .then(() => setSyncError(false))
        .catch(() => setSyncError(true));
    },
    [tableKey],
  );

  const toggleColumn = useCallback(
    (key: string, required: boolean) => {
      if (required) return;
      const next = visible.includes(key) ? visible.filter((k) => k !== key) : [...visible, key];
      persist(next);
    },
    [visible, persist],
  );

  const resetColumns = useCallback(() => {
    persist(defaultKeys);
    adminApi.resetColumnPreferences(tableKey).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableKey, persist]);

  return { visible, loading, syncError, toggleColumn, resetColumns };
}
