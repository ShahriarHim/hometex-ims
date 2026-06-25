import Pagination from './Pagination';
import LoadingSpinner from './LoadingSpinner';

/**
 * DataTable — server-side paginated table used across all list pages.
 *
 * ─── USAGE ──────────────────────────────────────────────────────────────────
 *
 * const columns = [
 *   { label: 'Name', render: (row) => row.name },
 *   { key: 'status', label: 'Status', sortable: true },
 *   {
 *     label: 'Action',
 *     render: (row) => (
 *       <>
 *         <Link to={`/brand/edit/${row.id}`}>
 *           <button className="btn btn-sm btn-warning"><i className="fa-solid fa-pen-to-square" /></button>
 *         </Link>
 *         <button onClick={() => handleDelete(row.id)} className="btn btn-sm btn-danger ms-1">
 *           <i className="fa-solid fa-trash" />
 *         </button>
 *       </>
 *     ),
 *   },
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={brands}
 *   isLoading={isLoading}
 *   meta={meta}
 *   onPageChange={setPage}
 *   showSerial
 * />
 *
 * ─── PROPS ───────────────────────────────────────────────────────────────────
 *
 * columns       Column[]      see Column shape below
 * data          object[]      current page rows
 * isLoading     boolean
 * meta          Meta | null   pagination metadata from API response
 * onPageChange  (page) => void
 * showSerial    boolean       prepend SL column (default true)
 * orderBy       string        currently sorted column key
 * direction     'asc'|'desc'
 * onSort        (key) => void  called when a sortable header is clicked
 * emptyText     string        shown when data is empty (default 'No data found')
 *
 * ─── Column shape ─────────────────────────────────────────────────────────
 *   key?      string    field key — used for sorting; not needed if not sortable
 *   label     string
 *   sortable? boolean
 *   render?   (row, index) => ReactNode  — if omitted, renders row[key]
 *   className? string   applied to both <th> and <td>
 *
 * ─── Meta shape (Laravel paginator) ──────────────────────────────────────
 *   total         number
 *   per_page      number
 *   current_page  number
 *   from          number   (1-based index of first row on this page)
 */
export default function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  meta = null,
  onPageChange,
  showSerial = true,
  orderBy,
  direction = 'asc',
  onSort,
  emptyText = 'No data found.',
}) {
  const startFrom = meta?.from ?? 1;

  const renderSortIcon = (col) => {
    if (!col.sortable) return null;
    if (orderBy !== col.key) return <i className="fas fa-sort ms-1 text-muted" />;
    return direction === 'asc'
      ? <i className="fas fa-sort-up ms-1" />
      : <i className="fas fa-sort-down ms-1" />;
  };

  return (
    <div>
      <div className="table-responsive">
        <table className="my-table table table-hover table-striped table-bordered">
          <thead>
            <tr>
              {showSerial && <th style={{ width: 50 }}>SL</th>}
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={col.className}
                  style={col.sortable ? { cursor: 'pointer', userSelect: 'none' } : undefined}
                  onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                >
                  {col.label}
                  {renderSortIcon(col)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (showSerial ? 1 : 0)}>
                  <LoadingSpinner />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (showSerial ? 1 : 0)}
                  className="text-center text-muted py-4"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.id ?? idx}>
                  {showSerial && <td>{startFrom + idx}</td>}
                  {columns.map((col, ci) => (
                    <td key={ci} className={col.className}>
                      {col.render ? col.render(row, idx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && onPageChange && (
        <div className="d-flex justify-content-between align-items-center mt-2">
          <small className="text-muted">
            Showing {meta.from ?? 0}–{Math.min(meta.from + data.length - 1, meta.total) || 0} of{' '}
            {meta.total} results
          </small>
          <Pagination
            currentPage={meta.current_page}
            totalItems={meta.total}
            perPage={meta.per_page}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
