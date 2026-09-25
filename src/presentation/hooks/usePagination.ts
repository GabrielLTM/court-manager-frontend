import { useMemo, useState } from 'react';

/** Paginação client-side (Sprint 6). Chame `setPage(1)` quando os filtros mudarem. */
export function usePagination<T>(items: readonly T[], pageSize = 8) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => items.slice((current - 1) * pageSize, current * pageSize),
    [items, current, pageSize],
  );
  return { page: current, pageCount, pageItems, setPage, total: items.length };
}
