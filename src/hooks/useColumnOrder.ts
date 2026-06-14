'use client';

import { useCallback, useEffect, useState } from 'react';

function isValidOrder(stored: string[], defaults: string[]) {
  if (stored.length !== defaults.length) return false;
  const defaultSet = new Set(defaults);
  return stored.every((id) => defaultSet.has(id));
}

export function useColumnOrder(tableId: string, defaultOrder: string[]) {
  const storageKey = `sn32-table-columns-${tableId}`;

  const [order, setOrder] = useState(defaultOrder);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as string[];
      if (isValidOrder(parsed, defaultOrder)) {
        setOrder(parsed);
      }
    } catch {
      // ignore invalid storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per table id
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(order));
  }, [order, storageKey]);

  const moveColumn = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setOrder((current) => {
      const next = [...current];
      const fromIndex = next.indexOf(fromId);
      const toIndex = next.indexOf(toId);
      if (fromIndex < 0 || toIndex < 0) return current;
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, fromId);
      return next;
    });
  }, []);

  return { order, moveColumn };
}
