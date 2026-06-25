import { useState, useEffect, useRef } from 'react';
import BasicInfoTab from './tabs/BasicInfoTab';
import PricingTab from './tabs/PricingTab';
import InventoryTab from './tabs/InventoryTab';
import AttributesTab from './tabs/AttributesTab';
import SpecificationsTab from './tabs/SpecificationsTab';
import ShippingTab from './tabs/ShippingTab';
import SeoTab from './tabs/SeoTab';
import PhotosTab from './tabs/PhotosTab';

const TABS = [
  { key: 'basic',          label: 'Basic Info' },
  { key: 'pricing',        label: 'Pricing' },
  { key: 'inventory',      label: 'Inventory' },
  { key: 'attributes',     label: 'Attributes' },
  { key: 'specifications', label: 'Specifications' },
  { key: 'shipping',       label: 'Shipping' },
  { key: 'seo',            label: 'SEO' },
  { key: 'photos',         label: 'Photos' },
];

const TAB_FIELDS = {
  basic: ['name', 'slug', 'sku', 'status', 'visibility', 'type', 'category_id',
    'sub_category_id', 'child_sub_category_id', 'brand_id', 'country_id',
    'supplier_id', 'short_description', 'description'],
  pricing: ['cost', 'price', 'discount_percent', 'discount_fixed', 'discount_start', 'discount_end'],
  inventory: ['stock', 'shop_id', 'track_stock'],
  attributes: ['attributes'],
  specifications: ['specifications'],
  shipping: ['weight', 'weight_unit', 'length', 'width', 'height', 'dimension_unit', 'shipping_class'],
  seo: ['meta_title', 'meta_description', 'og_image'],
};

function tabHasError(tabKey, errors) {
  return (TAB_FIELDS[tabKey] ?? []).some((f) => errors?.[f]);
}

export default function ProductFormTabs({ formData, onChange, formMeta = {}, errors = {}, productId, onPendingPhotosChange }) {
  const [activeTab, setActiveTab] = useState('basic');
  const tabBarRef = useRef(null);

  const { shops = [], attributes = [], ...restMeta } = formMeta;

  // Auto-jump to first tab with errors when errors change
  useEffect(() => {
    if (!errors || !Object.keys(errors).length) return;
    const firstErrorTab = TABS.find((t) => tabHasError(t.key, errors));
    if (firstErrorTab && firstErrorTab.key !== activeTab) {
      setActiveTab(firstErrorTab.key);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

  const errorCount = (tabKey) =>
    (TAB_FIELDS[tabKey] ?? []).filter((f) => errors?.[f]).length;

  return (
    <div>
      {/* ── Tab bar ── */}
      <div
        ref={tabBarRef}
        style={{
          display: 'flex',
          borderBottom: '2px solid #e5e7eb',
          marginBottom: 20,
          gap: 0,
          flexWrap: 'wrap',
          position: 'sticky',
          top: 54, // below the topbar
          background: '#fff',
          zIndex: 10,
          marginLeft: -16,
          marginRight: -16,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 8,
        }}
      >
        {TABS.map((t) => {
          const active   = activeTab === t.key;
          const hasError = tabHasError(t.key, errors);
          const count    = errorCount(t.key);
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: active
                  ? `2px solid ${hasError ? '#dc2626' : '#2563eb'}`
                  : '2px solid transparent',
                marginBottom: -2,
                padding: '7px 14px',
                fontSize: '0.8rem',
                fontWeight: active ? 600 : 400,
                color: hasError ? '#dc2626' : active ? '#2563eb' : '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                transition: 'color 0.15s',
              }}
            >
              {t.label}
              {hasError && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: '#dc2626', color: '#fff',
                  fontSize: '0.6rem', fontWeight: 700,
                  width: 16, height: 16, borderRadius: '50%',
                  lineHeight: 1,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab panels ── */}
      <div style={{ display: activeTab === 'basic'          ? 'block' : 'none' }}>
        <BasicInfoTab data={formData} onChange={onChange} formMeta={restMeta} errors={errors} />
      </div>
      <div style={{ display: activeTab === 'pricing'        ? 'block' : 'none' }}>
        <PricingTab data={formData} onChange={onChange} errors={errors} />
      </div>
      <div style={{ display: activeTab === 'inventory'      ? 'block' : 'none' }}>
        <InventoryTab data={formData} onChange={onChange} shops={shops} errors={errors} />
      </div>
      <div style={{ display: activeTab === 'attributes'     ? 'block' : 'none' }}>
        <AttributesTab data={formData} onChange={onChange} attributes={attributes} errors={errors} />
      </div>
      <div style={{ display: activeTab === 'specifications' ? 'block' : 'none' }}>
        <SpecificationsTab data={formData} onChange={onChange} errors={errors} />
      </div>
      <div style={{ display: activeTab === 'shipping'       ? 'block' : 'none' }}>
        <ShippingTab data={formData} onChange={onChange} errors={errors} />
      </div>
      <div style={{ display: activeTab === 'seo'            ? 'block' : 'none' }}>
        <SeoTab data={formData} onChange={onChange} errors={errors} />
      </div>
      <div style={{ display: activeTab === 'photos'         ? 'block' : 'none' }}>
        <PhotosTab productId={productId} onPendingChange={onPendingPhotosChange} />
      </div>
    </div>
  );
}
