/**
 * Skeleton — shimmer placeholder for loading states.
 *
 * Usage:
 *   <Skeleton height={20} width="60%" className="mb-2" />
 *   <SkeletonTable rows={5} cols={4} />
 */
export default function Skeleton({ height = 16, width = '100%', className = '' }) {
  return (
    <div
      className={`rounded ${className}`}
      style={{
        height,
        width,
        background: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.4s infinite',
      }}
    />
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <>
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i}>
                  <Skeleton height={14} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c}>
                    <Skeleton height={14} width={c === 0 ? '30%' : '80%'} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
