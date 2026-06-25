import { useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';
import { useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import { SkeletonTable } from '../../../shared/components/Skeleton';
import { useAuth } from '../../../shared/hooks/useAuth';
import {
  useCategories,
  useSubCategories,
  useChildSubCategories,
  fetchProductsForBarcode,
} from '../api';

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1800, showConfirmButton: false });

function calcAttrPrice(product, attr) {
  if (!attr) return product.price;
  const base = product.price;
  const n = Number(attr.attribute_number) || 0;
  switch (attr.attribute_math_sign) {
    case '+': return base + n;
    case '-': return base - n;
    case '*': return base * n;
    case '/': return n !== 0 ? base / n : base;
    default:  return base;
  }
}

function truncate(str, max) {
  return str && str.length > max ? str.slice(0, max) + '…' : str;
}

function BarcodeLabel({ product, attr }) {
  const attrPrice   = calcAttrPrice(product, attr);
  const hasDiscount = product.sell_price?.discount !== 0 && product.sell_price?.price;
  const displayPrice = hasDiscount ? product.sell_price.price : attrPrice;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 4px', fontSize: 9, fontFamily: 'monospace', lineHeight: 1.3, textAlign: 'center' }}>
      <div style={{ fontWeight: 'bold', fontSize: 11 }}>{product.brand?.name}</div>
      <Barcode
        value={product.sku}
        width={1}
        height={30}
        fontSize={8}
        margin={2}
        format="CODE128"
      />
      <div style={{ fontWeight: 'bold', fontSize: 10 }}>{truncate(product.name, 22)}</div>
      {attr && (
        <div style={{ fontSize: 8, color: '#444' }}>
          {attr.attributes?.name}: {attr.attribute_value?.name}
        </div>
      )}
      <div style={{ fontWeight: 'bold', fontSize: 11, marginTop: 2 }}>
        ৳{Number(displayPrice).toLocaleString()}
        {hasDiscount && (
          <span style={{ textDecoration: 'line-through', fontWeight: 'normal', color: '#888', marginLeft: 4, fontSize: 9 }}>
            ৳{attrPrice}
          </span>
        )}
      </div>
    </div>
  );
}

function PrintSheet({ items, columns, ref: printRef }) {
  const colWidth = `${(100 / columns).toFixed(2)}%`;
  return (
    <div ref={printRef} style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              width: colWidth,
              boxSizing: 'border-box',
              border: '1px solid #ccc',
              pageBreakInside: 'avoid',
            }}
          >
            <BarcodeLabel product={item.product} attr={item.attr} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BarcodeGeneratePage() {
  const { isAdmin, hasPermission } = useAuth();
  const canGenerate = isAdmin || hasPermission('barcode.generate');

  const qc = useQueryClient();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('generate');

  // ── Filter state ───────────────────────────────────────────────────────────
  const [categoryId,    setCategoryId]    = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [childSubId,    setChildSubId]    = useState('');
  const [nameSearch,    setNameSearch]    = useState('');
  const [isSearching,   setIsSearching]   = useState(false);

  // ── Search tab state ───────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');

  // ── Product selection ──────────────────────────────────────────────────────
  const [products,         setProducts]         = useState([]);
  const [selectedProduct,  setSelectedProduct]  = useState(null);
  const [selectedAttr,     setSelectedAttr]     = useState(null);

  // ── Print queue ────────────────────────────────────────────────────────────
  const [printItems, setPrintItems] = useState([]);
  const [columns,    setColumns]    = useState(4);

  const printRef = useRef(null);

  // ── Dropdown data ──────────────────────────────────────────────────────────
  const { data: categories = [],     isLoading: loadingCats   } = useCategories();
  const { data: subCategories = [],  isLoading: loadingSubs   } = useSubCategories(categoryId);
  const { data: childSubs = [],      isLoading: loadingChilds } = useChildSubCategories(subCategoryId);

  // ── Search handler (shared) ────────────────────────────────────────────────
  const runSearch = async (params) => {
    setIsSearching(true);
    setSelectedProduct(null);
    setSelectedAttr(null);
    try {
      const results = await qc.fetchQuery({
        queryKey: ['barcode', 'products', params],
        queryFn: () => fetchProductsForBarcode(params),
        staleTime: 0,
      });
      setProducts(results);
      if (results.length === 0) toast('info', 'No products found');
    } catch {
      toast('error', 'Search failed');
      setProducts([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (childSubId)    params.child_sub_category_id = childSubId;
    else if (subCategoryId) params.sub_category_id  = subCategoryId;
    else if (categoryId)    params.category_id       = categoryId;
    if (nameSearch.trim()) params.name = nameSearch.trim();
    if (!Object.keys(params).length) return toast('warning', 'Select a filter or enter a product name');
    runSearch(params);
  };

  const handleTabSearch = (e) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return toast('warning', 'Enter a product name or SKU');
    runSearch({ name: q });
  };

  // ── Product / attr selection ────────────────────────────────────────────────
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    const attrs = product.product_attributes ?? [];
    setSelectedAttr(attrs.length > 0 ? attrs[0] : null);
  };

  // ── Auto-load product when navigated from product list ─────────────────────
  useEffect(() => {
    const navProduct = location.state?.productSKU;
    if (!navProduct) return;
    setProducts([navProduct]);
    setSelectedProduct(navProduct);
    const attrs = navProduct.product_attributes ?? [];
    setSelectedAttr(attrs.length > 0 ? attrs[0] : null);
    setActiveTab('generate');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Print queue management ──────────────────────────────────────────────────
  const handleAddToQueue = () => {
    if (!selectedProduct) return toast('warning', 'Select a product first');
    const exists = printItems.some(
      (i) => i.product.id === selectedProduct.id && i.attr?.id === selectedAttr?.id,
    );
    if (exists) return toast('info', 'Already in queue');
    setPrintItems((prev) => [...prev, { product: selectedProduct, attr: selectedAttr }]);
    toast('success', 'Added to print queue');
  };

  const handleRemoveItem = (idx) =>
    setPrintItems((prev) => prev.filter((_, i) => i !== idx));

  // ── Reset category cascade ──────────────────────────────────────────────────
  const handleCategoryChange = (e) => {
    setCategoryId(e.target.value);
    setSubCategoryId('');
    setChildSubId('');
    setProducts([]);
    setSelectedProduct(null);
    setSelectedAttr(null);
  };

  const handleSubCategoryChange = (e) => {
    setSubCategoryId(e.target.value);
    setChildSubId('');
    setProducts([]);
    setSelectedProduct(null);
    setSelectedAttr(null);
  };

  // ── Print ───────────────────────────────────────────────────────────────────
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Hometex Barcodes',
    pageStyle: `
      @page { margin: 5mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  return (
    <div>
      <PageHeader
        title="Barcode Generator"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Barcode' }]}
      />

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <i className="fa-solid fa-magnifying-glass me-1" />Search Product
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            <i className="fa-solid fa-barcode me-1" />Generate Barcode
          </button>
        </li>
      </ul>

      {/* ── Search Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'search' && (
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleTabSearch} className="d-flex gap-2 mb-3" style={{ maxWidth: 480 }}>
              <div className="input-group">
                <span className="input-group-text"><i className="fa-solid fa-magnifying-glass" /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Product name or SKU…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSearching}>
                {isSearching ? <span className="spinner-border spinner-border-sm" /> : 'Search'}
              </button>
            </form>

            {isSearching && <SkeletonTable rows={5} cols={4} />}

            {!isSearching && products.length > 0 && (
              <table className="table table-sm table-hover table-bordered mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="fw-semibold">{p.name}</td>
                      <td><code>{p.sku}</code></td>
                      <td><small className="text-muted">{p.brand?.name}</small></td>
                      <td className="text-center">
                        {canGenerate && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              setActiveTab('generate');
                              handleSelectProduct(p);
                              setProducts([p]);
                            }}
                          >
                            <i className="fa-solid fa-barcode me-1" />Generate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!isSearching && products.length === 0 && searchInput && (
              <div className="text-center text-muted py-4">
                <i className="fa-solid fa-barcode fa-2x mb-2 d-block opacity-25" />
                Type a product name or SKU and press Search
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Generate Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'generate' && (
        <div className="row g-3">
          {/* Left — filter + product selector */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header py-2 fw-semibold">Select Product</div>
              <div className="card-body">
                <form onSubmit={handleGenerateSearch}>
                  <div className="mb-2">
                    <label className="form-label small text-muted mb-1">Category</label>
                    <select
                      className="form-select form-select-sm"
                      value={categoryId}
                      onChange={handleCategoryChange}
                      disabled={loadingCats}
                    >
                      <option value="">All categories</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {categoryId && (
                    <div className="mb-2">
                      <label className="form-label small text-muted mb-1">Sub-category</label>
                      <select
                        className="form-select form-select-sm"
                        value={subCategoryId}
                        onChange={handleSubCategoryChange}
                        disabled={loadingSubs}
                      >
                        <option value="">All sub-categories</option>
                        {subCategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}

                  {subCategoryId && (
                    <div className="mb-2">
                      <label className="form-label small text-muted mb-1">Child sub-category</label>
                      <select
                        className="form-select form-select-sm"
                        value={childSubId}
                        onChange={(e) => { setChildSubId(e.target.value); setProducts([]); setSelectedProduct(null); }}
                        disabled={loadingChilds}
                      >
                        <option value="">All child sub-categories</option>
                        {childSubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small text-muted mb-1">Name / SKU search</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Product name or SKU…"
                      value={nameSearch}
                      onChange={(e) => setNameSearch(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-sm w-100" disabled={isSearching}>
                    {isSearching
                      ? <><span className="spinner-border spinner-border-sm me-1" />Loading…</>
                      : <><i className="fa-solid fa-search me-1" />Load Products</>}
                  </button>
                </form>

                {products.length > 0 && (
                  <div className="mt-3 border-top pt-3">
                    <div className="small text-muted mb-1">{products.length} product{products.length !== 1 ? 's' : ''} found</div>
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {products.map((p) => (
                        <div
                          key={p.id}
                          className={`p-2 rounded mb-1 ${selectedProduct?.id === p.id ? 'bg-primary text-white' : 'bg-light'}`}
                          style={{ cursor: 'pointer', fontSize: '0.83rem' }}
                          onClick={() => handleSelectProduct(p)}
                        >
                          <div className="fw-semibold">{p.name}</div>
                          <small className={selectedProduct?.id === p.id ? 'text-white-50' : 'text-muted'}>
                            {p.sku}
                          </small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProduct && (
                  <div className="mt-3 border-top pt-3">
                    <label className="form-label small text-muted mb-1">Attribute</label>
                    {(selectedProduct.product_attributes ?? []).length === 0 ? (
                      <div className="text-muted small">No attributes</div>
                    ) : (
                      (selectedProduct.product_attributes).map((attr) => (
                        <div
                          key={attr.id}
                          className={`p-2 rounded mb-1 d-flex justify-content-between align-items-center ${selectedAttr?.id === attr.id ? 'bg-success text-white' : 'bg-light'}`}
                          style={{ cursor: 'pointer', fontSize: '0.82rem' }}
                          onClick={() => setSelectedAttr(attr)}
                        >
                          <span>
                            {attr.attributes?.name}: <strong>{attr.attribute_value?.name}</strong>
                          </span>
                          <span className={selectedAttr?.id === attr.id ? 'text-white-50' : 'text-muted'} style={{ fontSize: '0.78rem' }}>
                            ৳{calcAttrPrice(selectedProduct, attr)}
                          </span>
                        </div>
                      ))
                    )}

                    {canGenerate && (
                      <button
                        className="btn btn-primary btn-sm w-100 mt-2"
                        onClick={handleAddToQueue}
                      >
                        <i className="fa-solid fa-plus me-1" />Add to Print Queue
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right — queue + preview */}
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header py-2 d-flex justify-content-between align-items-center">
                <span className="fw-semibold">
                  <i className="fa-solid fa-print me-2 text-muted" />
                  Print Queue
                  <span className="badge bg-primary ms-2">{printItems.length}</span>
                </span>
                <div className="d-flex gap-2 align-items-center">
                  <label className="text-muted small mb-0">Cols:</label>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 65 }}
                    value={columns}
                    onChange={(e) => setColumns(Number(e.target.value))}
                  >
                    {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  {canGenerate && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={handlePrint}
                      disabled={!printItems.length}
                    >
                      <i className="fa-solid fa-print me-1" />Print
                    </button>
                  )}
                </div>
              </div>

              <div className="card-body">
                {printItems.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <i className="fa-solid fa-barcode fa-3x mb-3 d-block opacity-25" />
                    <p className="mb-0">Select a product and add to queue.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      {printItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="d-flex justify-content-between align-items-center bg-light rounded p-2 mb-1"
                        >
                          <div style={{ fontSize: '0.85rem' }}>
                            <span className="fw-semibold">{item.product.name}</span>
                            {item.attr && (
                              <span className="text-muted ms-2 small">
                                {item.attr.attributes?.name}: {item.attr.attribute_value?.name}
                              </span>
                            )}
                            <code className="ms-2 text-muted" style={{ fontSize: '0.75rem' }}>
                              {item.product.sku}
                            </code>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveItem(idx)}
                          >
                            <i className="fa-solid fa-xmark" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="border rounded p-2 bg-white">
                      <div className="text-muted small mb-2">Preview ({columns} columns)</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {printItems.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: `${(100 / columns).toFixed(2)}%`,
                              boxSizing: 'border-box',
                              border: '1px solid #ccc',
                            }}
                          >
                            <BarcodeLabel product={item.product} attr={item.attr} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Hidden print target ─────────────────────────────────────────────── */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} style={{ width: '100%' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {printItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  width: `${(100 / columns).toFixed(2)}%`,
                  boxSizing: 'border-box',
                  border: '1px solid #ccc',
                  pageBreakInside: 'avoid',
                }}
              >
                <BarcodeLabel product={item.product} attr={item.attr} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
