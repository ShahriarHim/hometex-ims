import { useParams, Link } from 'react-router-dom';
import { Row, Col } from 'react-bootstrap';
import PageHeader from '../../../shared/components/PageHeader';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import SafeHtml from '../../../shared/components/SafeHtml';
import { formatPrice, formatDate } from '../../../shared/utils/formatters';
import { useProduct } from '../api';
import { useAuth } from '../../../shared/hooks/useAuth';

// ─── Design tokens (match style.scss) ────────────────────────────────────────
const C = {
  border:   '#e5e7eb',
  muted:    '#6b7280',
  label:    '#9ca3af',
  blue:     '#2563eb',
  blueSoft: 'rgba(37,99,235,0.08)',
  text:     '#111827',
  subtext:  '#374151',
  success:  '#16a34a',
  danger:   '#dc2626',
  surface:  '#fff',
  bg:       '#f8fafc',
};

const BADGE_FIELDS = [
  { key: 'isFeatured',         label: 'Featured',       icon: 'fa-star',        color: '#d97706', bg: '#fef3c7' },
  { key: 'isNew',              label: 'New',             icon: 'fa-sparkles',    color: '#2563eb', bg: '#dbeafe' },
  { key: 'isTrending',         label: 'Trending',        icon: 'fa-fire',        color: '#dc2626', bg: '#fee2e2' },
  { key: 'is_bestseller',      label: 'Bestseller',      icon: 'fa-trophy',      color: '#059669', bg: '#d1fae5' },
  { key: 'is_limited_edition', label: 'Limited Edition', icon: 'fa-gem',         color: '#7c3aed', bg: '#ede9fe' },
  { key: 'is_exclusive',       label: 'Exclusive',       icon: 'fa-crown',       color: '#b45309', bg: '#fef3c7' },
  { key: 'is_eco_friendly',    label: 'Eco Friendly',    icon: 'fa-leaf',        color: '#15803d', bg: '#dcfce7' },
];

// ─── Micro components ─────────────────────────────────────────────────────────

function InfoRow({ label, value, mono }) {
  if (value == null || value === '') return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ color: C.label, fontSize: '0.775rem', fontWeight: 500, flexShrink: 0, marginRight: 12 }}>{label}</span>
      <span style={{ color: C.subtext, fontSize: '0.825rem', fontWeight: 500, textAlign: 'right',
        fontFamily: mono ? 'monospace' : undefined }}>{value}</span>
    </div>
  );
}

function Section({ title, icon, children, noPad }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
      marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <i className={`fa-solid ${icon}`} style={{ color: C.blue, fontSize: '0.8rem', width: 16, textAlign: 'center' }} />}
        <span style={{ fontWeight: 600, fontSize: '0.825rem', color: C.text }}>{title}</span>
      </div>
      <div style={noPad ? {} : { padding: '4px 16px 12px' }}>{children}</div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ flex: 1, minWidth: 110, background: accent ? C.blueSoft : C.bg,
      border: `1px solid ${accent ? 'rgba(37,99,235,0.2)' : C.border}`,
      borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: '0.72rem', color: C.label, fontWeight: 500, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: accent ? C.blue : C.text, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Left sidebar ─────────────────────────────────────────────────────────────

function Sidebar({ product, id, canEdit }) {
  const photos  = product.photos ?? [];
  const primary = photos.find((p) => p.is_primary) ?? photos[0];
  const rest    = photos.filter((p) => p !== primary);

  const activeBadges = BADGE_FIELDS.filter((b) => product[b.key]);

  return (
    <div style={{ position: 'sticky', top: 80 }}>

      {/* Primary photo */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
        marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ aspectRatio: '4/3', background: C.bg, position: 'relative' }}>
          {primary ? (
            <img src={primary.url} alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', color: C.label }}>
              <i className="fa-regular fa-image" style={{ fontSize: '2rem', marginBottom: 8 }} />
              <span style={{ fontSize: '0.75rem' }}>No photo</span>
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {rest.length > 0 && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 10px', flexWrap: 'wrap',
            borderTop: `1px solid ${C.border}`, background: C.bg }}>
            {rest.map((p) => (
              <div key={p.id} style={{ width: 48, height: 48, borderRadius: 6, overflow: 'hidden',
                border: `1px solid ${C.border}`, flexShrink: 0 }}>
                <img src={p.thumbnail || p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}

        {canEdit && (
          <div style={{ padding: '8px 12px', borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
            <Link to={`/product/photo/${id}`}
              style={{ fontSize: '0.75rem', color: C.blue, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <i className="fa-solid fa-images" />
              Manage photos ({photos.length})
            </Link>
          </div>
        )}
      </div>

      {/* Badges */}
      {activeBadges.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: '12px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {activeBadges.map((b) => (
            <span key={b.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
              background: b.bg, color: b.color, fontSize: '0.7rem', fontWeight: 600,
              padding: '3px 9px', borderRadius: 20 }}>
              <i className={`fa-solid ${b.icon}`} style={{ fontSize: '0.65rem' }} />
              {b.label}
            </span>
          ))}
        </div>
      )}

      {/* Quick facts */}
      <Section title="Classification" icon="fa-folder-open">
        <InfoRow label="Category"     value={product.category?.name} />
        <InfoRow label="Sub-category" value={product.sub_category?.name} />
        <InfoRow label="Child"        value={product.child_sub_category?.name} />
        <InfoRow label="Brand"        value={product.brand?.name} />
        <InfoRow label="Supplier"     value={product.supplier?.name} />
        <InfoRow label="Origin"       value={product.country?.name} />
      </Section>

      <Section title="Timestamps" icon="fa-clock">
        <InfoRow label="Created" value={formatDate(product.created_at)} />
        <InfoRow label="Updated" value={formatDate(product.updated_at)} />
      </Section>
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function MainContent({ product }) {
  const shopQtys   = product.shop_quantities ?? [];
  const attrs      = Object.values(product.attributes ?? {});
  const specs      = Object.values(product.specifications ?? {});
  const hasDim     = product.length || product.width || product.height;
  const hasDiscount= product.discount_percent || product.discount_fixed;

  // Status pill
  const isActive = Number(product.status) === 1;

  return (
    <>
      {/* Hero stats row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <StatCard label="Regular Price" value={formatPrice(product.price)} accent />
        <StatCard label="Cost Price"    value={formatPrice(product.cost)} />
        {hasDiscount && (
          <StatCard
            label="Discount"
            value={[
              product.discount_percent ? `${product.discount_percent}%` : null,
              product.discount_fixed   ? formatPrice(product.discount_fixed) : null,
            ].filter(Boolean).join(' + ')}
            sub={product.discount_start ? `${formatDate(product.discount_start)} – ${formatDate(product.discount_end)}` : undefined}
          />
        )}
        <StatCard label="Total Stock"  value={product.stock ?? 0} />
        <div style={{ flex: 1, minWidth: 110, background: isActive ? '#f0fdf4' : C.bg,
          border: `1px solid ${isActive ? '#bbf7d0' : C.border}`, borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: '0.72rem', color: C.label, fontWeight: 500, marginBottom: 3 }}>Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%',
              background: isActive ? C.success : C.muted, flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600,
              color: isActive ? C.success : C.muted }}>{isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: C.muted, marginTop: 2 }}>
            {product.visibility} · {product.type}
          </div>
        </div>
      </div>

      {/* SKU */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '0.75rem', color: C.label }}>SKU</span>
        <code style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 5,
          padding: '2px 8px', fontSize: '0.8rem', color: C.subtext, fontWeight: 600 }}>
          {product.sku || '—'}
        </code>
      </div>

      {/* Descriptions */}
      {product.short_description && (
        <Section title="Short Description" icon="fa-align-left">
          <p style={{ margin: 0, fontSize: '0.875rem', color: C.subtext, lineHeight: 1.6 }}>
            {product.short_description}
          </p>
        </Section>
      )}

      {product.description && (
        <Section title="Description" icon="fa-file-lines">
          <div style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>
            <SafeHtml html={product.description} />
          </div>
        </Section>
      )}

      {/* Pricing detail */}
      {hasDiscount && (
        <Section title="Pricing Detail" icon="fa-tag">
          <InfoRow label="Regular Price"   value={formatPrice(product.price)} />
          <InfoRow label="Old Price"        value={product.old_price ? formatPrice(product.old_price) : null} />
          <InfoRow label="Discount %"       value={product.discount_percent ? `${product.discount_percent}%` : null} />
          <InfoRow label="Discount Fixed"   value={product.discount_fixed ? formatPrice(product.discount_fixed) : null} />
          <InfoRow label="Cost Price"       value={formatPrice(product.cost)} />
          <InfoRow label="Discount Period"  value={product.discount_start
            ? `${formatDate(product.discount_start)} – ${formatDate(product.discount_end)}` : null} />
        </Section>
      )}

      {/* Inventory */}
      <Section title="Inventory" icon="fa-warehouse" noPad={shopQtys.length > 0}>
        {shopQtys.length === 0 ? (
          <div style={{ padding: '4px 0 8px', color: C.muted, fontSize: '0.825rem' }}>
            Not assigned to any shop.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg }}>
                <th style={{ padding: '8px 16px', fontSize: '0.75rem', color: C.label,
                  fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>
                  Shop / Branch
                </th>
                <th style={{ padding: '8px 16px', fontSize: '0.75rem', color: C.label,
                  fontWeight: 600, textAlign: 'right', borderBottom: `1px solid ${C.border}` }}>
                  Stock
                </th>
              </tr>
            </thead>
            <tbody>
              {shopQtys.map((sq, i) => (
                <tr key={sq.shop_id} style={{ background: i % 2 === 0 ? C.surface : C.bg }}>
                  <td style={{ padding: '8px 16px', fontSize: '0.825rem', color: C.subtext,
                    borderBottom: `1px solid ${C.border}` }}>
                    {sq.shop_name || `Shop #${sq.shop_id}`}
                  </td>
                  <td style={{ padding: '8px 16px', fontSize: '0.825rem', fontWeight: 600,
                    textAlign: 'right', color: sq.quantity > 0 ? C.success : C.danger,
                    borderBottom: `1px solid ${C.border}` }}>
                    {sq.quantity}
                  </td>
                </tr>
              ))}
              <tr style={{ background: C.blueSoft }}>
                <td style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, color: C.text }}>
                  Total
                </td>
                <td style={{ padding: '8px 16px', fontSize: '0.875rem', fontWeight: 700,
                  textAlign: 'right', color: C.blue }}>
                  {product.stock ?? 0}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </Section>

      {/* Shipping */}
      {(product.weight || hasDim || product.shipping_class) && (
        <Section title="Shipping" icon="fa-truck">
          <InfoRow label="Weight"
            value={product.weight ? `${product.weight} ${product.weight_unit ?? 'kg'}` : null} />
          <InfoRow label="Dimensions (L × W × H)"
            value={hasDim
              ? `${product.length ?? 0} × ${product.width ?? 0} × ${product.height ?? 0} ${product.dimension_unit ?? 'cm'}`
              : null} />
          <InfoRow label="Shipping Class" value={product.shipping_class} />
        </Section>
      )}

      {/* Attributes */}
      {attrs.length > 0 && (
        <Section title="Attributes" icon="fa-sliders" noPad>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {['Attribute', 'Value', 'Add. Cost', 'Weight'].map((h) => (
                  <th key={h} style={{ padding: '8px 16px', fontSize: '0.75rem', color: C.label,
                    fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attrs.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? C.surface : C.bg }}>
                  <td style={{ padding: '8px 16px', fontSize: '0.825rem', color: C.subtext,
                    borderBottom: `1px solid ${C.border}` }}>{row.attribute_id || '—'}</td>
                  <td style={{ padding: '8px 16px', fontSize: '0.825rem', color: C.subtext,
                    borderBottom: `1px solid ${C.border}` }}>{row.value_id || '—'}</td>
                  <td style={{ padding: '8px 16px', fontSize: '0.825rem', color: C.subtext,
                    borderBottom: `1px solid ${C.border}` }}>
                    {row.attribute_cost ? formatPrice(row.attribute_cost) : '—'}
                  </td>
                  <td style={{ padding: '8px 16px', fontSize: '0.825rem', color: C.subtext,
                    borderBottom: `1px solid ${C.border}` }}>{row.attribute_weight || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* Specifications */}
      {specs.length > 0 && (
        <Section title="Specifications" icon="fa-list-check" noPad>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {specs.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? C.surface : C.bg }}>
                  <td style={{ padding: '8px 16px', fontSize: '0.825rem', fontWeight: 600,
                    color: C.text, width: '38%', borderBottom: `1px solid ${C.border}` }}>
                    {row.name || '—'}
                  </td>
                  <td style={{ padding: '8px 16px', fontSize: '0.825rem', color: C.subtext,
                    borderBottom: `1px solid ${C.border}` }}>
                    {row.value || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* SEO */}
      {(product.meta_title || product.meta_description || product.og_image) && (
        <Section title="SEO" icon="fa-magnifying-glass">
          <InfoRow label="Meta Title"       value={product.meta_title} />
          <InfoRow label="Meta Description" value={product.meta_description} />
          <InfoRow label="OG Image"         value={product.og_image} />

          {(product.meta_title || product.meta_description) && (
            <div style={{ marginTop: 12, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '12px 14px', background: C.surface }}>
              <div style={{ fontSize: '0.65rem', color: C.muted, fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                SERP Preview
              </div>
              <div style={{ color: '#1a0dab', fontSize: '1rem', fontWeight: 500, marginBottom: 2 }}>
                {product.meta_title || '(no title)'}
              </div>
              <div style={{ color: '#006621', fontSize: '0.75rem', marginBottom: 4 }}>
                hometexbangladesh.com › products › {product.slug}
              </div>
              <div style={{ color: '#4d5156', fontSize: '0.8rem', lineHeight: 1.5 }}>
                {product.meta_description || '(no description)'}
              </div>
            </div>
          )}
        </Section>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductDetailsPage() {
  const { id } = useParams();
  const { hasPermission, isAdmin } = useAuth();
  const canEdit = isAdmin || hasPermission('products.edit');
  const { data: product, isLoading, isError } = useProduct(id);

  if (isLoading) return <LoadingSpinner fullPage />;
  if (isError || !product) {
    return (
      <div className="alert alert-danger m-4">
        Product not found or failed to load.{' '}
        <Link to="/products">Back to list</Link>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={product.name}
        breadcrumb={[
          { label: 'Products', to: '/products' },
          { label: product.name },
        ]}
        actionLabel={canEdit ? 'Edit Product' : undefined}
        actionTo={canEdit ? `/product/edit/${id}` : undefined}
        actionIcon={canEdit ? 'fa-solid fa-pen-to-square' : undefined}
      />

      <Row className="g-4">
        <Col lg={4} xl={3}>
          <Sidebar product={product} id={id} canEdit={canEdit} />
        </Col>
        <Col lg={8} xl={9}>
          <MainContent product={product} />
        </Col>
      </Row>
    </>
  );
}
