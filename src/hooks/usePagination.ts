import { useEffect, useState } from 'react';

export function usePagination<T>(items: T[], pageSize: number, resetKey: string) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);
  return { page, setPage, pageCount, pageItems, total: items.length, pageSize };
}