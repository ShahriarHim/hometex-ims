/**
 * Server-side pagination control.
 *
 * Usage:
 *   <Pagination
 *     currentPage={page}
 *     totalItems={data.total}
 *     perPage={15}
 *     onPageChange={setPage}
 *   />
 *
 * Props:
 *   currentPage  number   1-based current page
 *   totalItems   number   total record count from API
 *   perPage      number   records per page (default 15)
 *   onPageChange (page: number) => void
 *   siblingCount number   pages shown on each side of current (default 1)
 */
export default function Pagination({
  currentPage,
  totalItems,
  perPage = 15,
  onPageChange,
  siblingCount = 1,
}) {
  const totalPages = Math.ceil(totalItems / perPage);
  if (totalPages <= 1) return null;

  const range = (start, end) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const buildPages = () => {
    const leftSibling = Math.max(currentPage - siblingCount, 1);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages);
    const showLeftDots = leftSibling > 2;
    const showRightDots = rightSibling < totalPages - 1;

    if (!showLeftDots && !showRightDots) {
      return range(1, totalPages);
    }
    if (!showLeftDots) {
      return [...range(1, rightSibling + 1), '...', totalPages];
    }
    if (!showRightDots) {
      return [1, '...', ...range(leftSibling - 1, totalPages)];
    }
    return [1, '...', ...range(leftSibling, rightSibling), '...', totalPages];
  };

  const pages = buildPages();

  return (
    <nav aria-label="Page navigation">
      <ul className="pagination pagination-sm mb-0 flex-wrap">
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(currentPage - 1)}>
            &laquo;
          </button>
        </li>

        {pages.map((page, idx) =>
          page === '...' ? (
            <li key={`dots-${idx}`} className="page-item disabled">
              <span className="page-link">…</span>
            </li>
          ) : (
            <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
              <button className="page-link" onClick={() => onPageChange(page)}>
                {page}
              </button>
            </li>
          )
        )}

        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(currentPage + 1)}>
            &raquo;
          </button>
        </li>
      </ul>
    </nav>
  );
}
