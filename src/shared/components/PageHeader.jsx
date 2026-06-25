import { Link } from 'react-router-dom';

/**
 * PageHeader — page title + breadcrumb + optional action button.
 * Replaces the Breadcrumb + CardHeader pattern used in every legacy list page.
 *
 * Usage:
 *   <PageHeader
 *     title="Brand List"
 *     breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Brands' }]}
 *     actionLabel="Add Brand"
 *     actionTo="/brand/create"
 *   />
 *
 *   // With a button instead of a link:
 *   <PageHeader
 *     title="Product Attributes"
 *     actionLabel="Add Attribute"
 *     onAction={() => setShowModal(true)}
 *   />
 *
 * Props:
 *   title        string
 *   breadcrumb   { label, to? }[]     optional
 *   actionLabel  string               button/link text
 *   actionTo     string               if provided renders a <Link>
 *   onAction     () => void           if provided (and no actionTo) renders a <button>
 *   actionIcon   string               Font Awesome class (default 'fa-plus')
 */
export default function PageHeader({
  title,
  breadcrumb = [],
  actionLabel,
  actionTo,
  onAction,
  actionIcon = 'fa-plus',
}) {
  return (
    <div className="page-header-row">
      <div>
        <h1 className="page-title">{title}</h1>
        {breadcrumb.length > 0 && (
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              {breadcrumb.map((crumb, i) => {
                const isLast = i === breadcrumb.length - 1;
                return (
                  <li
                    key={i}
                    className={`breadcrumb-item${isLast ? ' active' : ''}`}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {!isLast && crumb.to ? (
                      <Link to={crumb.to}>{crumb.label}</Link>
                    ) : (
                      crumb.label
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </div>

      {actionLabel && (
        <div>
          {actionTo ? (
            <Link to={actionTo} className="btn btn-sm btn-primary">
              <i className={`fa-solid ${actionIcon} me-1`} />
              {actionLabel}
            </Link>
          ) : onAction ? (
            <button className="btn btn-sm btn-primary" onClick={onAction}>
              <i className={`fa-solid ${actionIcon} me-1`} />
              {actionLabel}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
