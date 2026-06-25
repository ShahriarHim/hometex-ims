import { useState, useCallback } from 'react';

/**
 * useTableParams — manages the shared search/sort/pagination state used by
 * every list page in the system. Reduces repetition across feature modules.
 *
 * Usage:
 *   const { params, setPage, setSearch, setSort, setPerPage, resetPage } =
 *     useTableParams({ orderBy: 'serial', perPage: 10 });
 *
 *   const { data, isLoading } = useQuery({
 *     queryKey: ['brands', params],
 *     queryFn: () => fetchBrands(params),
 *   });
 *
 *   <DataTable
 *     ...
 *     orderBy={params.order_by}
 *     direction={params.direction}
 *     onSort={setSort}
 *     meta={data?.meta}
 *     onPageChange={setPage}
 *   />
 *
 * Returns:
 *   params      { page, per_page, search, order_by, direction }
 *   setPage     (page: number) => void
 *   setSearch   (search: string) => void   (resets to page 1)
 *   setPerPage  (n: number) => void        (resets to page 1)
 *   setSort     (key: string) => void      (toggles direction, resets to page 1)
 *   resetPage   () => void
 */
export function useTableParams({
  orderBy = 'created_at',
  direction = 'desc',
  perPage = 15,
} = {}) {
  const [params, setParams] = useState({
    page: 1,
    per_page: perPage,
    search: '',
    order_by: orderBy,
    direction,
  });

  const setPage = useCallback((page) => setParams((p) => ({ ...p, page })), []);

  const setSearch = useCallback(
    (search) => setParams((p) => ({ ...p, search, page: 1 })),
    []
  );

  const setPerPage = useCallback(
    (per_page) => setParams((p) => ({ ...p, per_page, page: 1 })),
    []
  );

  const setSort = useCallback((key) => {
    setParams((p) => ({
      ...p,
      order_by: key,
      direction: p.order_by === key && p.direction === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }, []);

  const resetPage = useCallback(() => setParams((p) => ({ ...p, page: 1 })), []);

  return { params, setPage, setSearch, setPerPage, setSort, resetPage };
}
