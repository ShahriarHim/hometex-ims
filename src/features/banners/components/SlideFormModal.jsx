import { useState, useEffect, useRef } from 'react';
import AppModal from '../../../shared/components/AppModal';
import SlidePreview from './SlidePreview';

const PRESETS = [
  { value: 'striped_overlay', label: 'Striped Overlay' },
  { value: 'full_image',      label: 'Full Image' },
  { value: 'split_text',      label: 'Split Text' },
  { value: 'minimal',         label: 'Minimal' },
];

const EMPTY = {
  name: '', preset: 'striped_overlay',
  heading: '', subheading: '', button_label: '', button_url: '',
  bg_color: '#1e2d3d', stripe_color: '#2563eb', text_color: '#ffffff', button_color: '#2563eb',
  text_position: 'center', animate_stripes: true,
  status: 1, order_position: 0,
};

export default function SlideFormModal({ show, onHide, onSubmit, initial = null, isLoading }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(EMPTY);
  const [sliderPreview, setSliderPreview] = useState(null);
  const [sliderB64, setSliderB64] = useState(null);
  const [overlayPreviews, setOverlayPreviews] = useState([]);
  const [overlayB64s, setOverlayB64s] = useState([]);
  const sliderRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (show) {
      setForm(initial ? {
        name:           initial.name           ?? '',
        preset:         initial.preset         ?? 'striped_overlay',
        heading:        initial.heading        ?? '',
        subheading:     initial.subheading     ?? '',
        button_label:   initial.button_label   ?? '',
        button_url:     initial.button_url     ?? '',
        bg_color:       initial.bg_color       ?? '#1e2d3d',
        stripe_color:   initial.stripe_color   ?? '#2563eb',
        text_color:     initial.text_color     ?? '#ffffff',
        button_color:   initial.button_color   ?? '#2563eb',
        text_position:  initial.text_position  ?? 'center',
        animate_stripes: initial.animate_stripes ?? true,
        status:         initial.status         ?? 1,
        order_position: initial.order_position ?? 0,
      } : EMPTY);
      setSliderPreview(null); setSliderB64(null);
      setOverlayPreviews([]); setOverlayB64s([]);
    }
  }, [show, initial]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSlider = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setSliderPreview(ev.target.result); setSliderB64(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handleOverlays = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    const previews = [], b64s = [];
    let done = 0;
    files.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        previews[i] = ev.target.result;
        b64s[i]     = ev.target.result;
        done++;
        if (done === files.length) { setOverlayPreviews([...previews]); setOverlayB64s([...b64s]); }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = () => {
    const payload = { ...form };
    if (sliderB64) payload.slider = sliderB64;
    if (overlayB64s.length) payload.overlay_images = overlayB64s;
    if (isEdit) payload.id = initial.id;
    onSubmit(payload);
  };

  // Preview slide — merges saved URLs with local previews
  const previewSlide = {
    ...form,
    slider_url:         initial?.slider_url ?? null,
    overlay_image_urls: initial?.overlay_image_urls ?? [],
    slider_preview:     sliderPreview,
    overlay_previews:   overlayPreviews,
  };

  return (
    <AppModal
      show={show}
      title={isEdit ? 'Edit Slide' : 'New Slide'}
      onHide={onHide}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? 'Save Changes' : 'Create Slide'}
      isLoading={isLoading}
      size="xl"
    >
      <div className="row g-0" style={{ minHeight: 480 }}>
        {/* ── Form ── */}
        <div className="col-lg-7 pe-lg-3" style={{ borderRight: '1px solid #e5e7eb', overflowY: 'auto', maxHeight: 560 }}>
          <div className="row g-3 p-2">
            {/* Basic */}
            <div className="col-12">
              <label className="form-label fw-500" style={{ fontSize: '0.82rem' }}>Slide Name *</label>
              <input className="form-control form-control-sm" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Preset</label>
              <select className="form-select form-select-sm" value={form.preset} onChange={(e) => set('preset', e.target.value)}>
                {PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Text Position</label>
              <select className="form-select form-select-sm" value={form.text_position} onChange={(e) => set('text_position', e.target.value)}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>

            {/* Content */}
            <div className="col-12">
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Heading</label>
              <input className="form-control form-control-sm" value={form.heading} onChange={(e) => set('heading', e.target.value)} placeholder="Main slide heading" />
            </div>
            <div className="col-12">
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Subheading</label>
              <input className="form-control form-control-sm" value={form.subheading} onChange={(e) => set('subheading', e.target.value)} placeholder="Supporting text" />
            </div>
            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Button Label</label>
              <input className="form-control form-control-sm" value={form.button_label} onChange={(e) => set('button_label', e.target.value)} placeholder="Shop Now" />
            </div>
            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Button URL</label>
              <input className="form-control form-control-sm" value={form.button_url} onChange={(e) => set('button_url', e.target.value)} placeholder="/products" />
            </div>

            {/* Colors */}
            <div className="col-12">
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 500 }}>Colors</label>
              <div className="d-flex gap-3 flex-wrap">
                {[
                  { key: 'bg_color',     label: 'Background' },
                  { key: 'stripe_color', label: 'Stripe' },
                  { key: 'text_color',   label: 'Text' },
                  { key: 'button_color', label: 'Button' },
                ].map(({ key, label }) => (
                  <div key={key} className="d-flex flex-column align-items-center gap-1">
                    <input
                      type="color"
                      value={form[key] ?? '#000000'}
                      onChange={(e) => set(key, e.target.value)}
                      style={{ width: 40, height: 36, border: 'none', padding: 2, borderRadius: 4, cursor: 'pointer' }}
                      title={label}
                    />
                    <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Images */}
            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Background Image</label>
              <input ref={sliderRef} type="file" accept="image/*" className="d-none" onChange={handleSlider} />
              <button type="button" className="btn btn-outline-secondary btn-sm w-100" onClick={() => sliderRef.current?.click()}>
                <i className="fa-solid fa-image me-1" />
                {sliderPreview ? 'Change Image' : (initial?.slider_url ? 'Replace Image' : 'Upload Image')}
              </button>
              {(sliderPreview || initial?.slider_url) && (
                <img src={sliderPreview || initial.slider_url} alt="" className="mt-1 rounded" style={{ width: '100%', height: 60, objectFit: 'cover' }} />
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Overlay Images <span style={{ color: '#6b7280' }}>(max 5)</span></label>
              <input ref={overlayRef} type="file" accept="image/*" multiple className="d-none" onChange={handleOverlays} />
              <button type="button" className="btn btn-outline-secondary btn-sm w-100" onClick={() => overlayRef.current?.click()}>
                <i className="fa-solid fa-images me-1" />
                Upload Overlays
              </button>
              {overlayPreviews.length > 0 && (
                <div className="d-flex gap-1 mt-1 flex-wrap">
                  {overlayPreviews.map((src, i) => (
                    <img key={i} src={src} alt="" style={{ width: 36, height: 36, objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: 3 }} />
                  ))}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="col-md-4">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="animate_stripes"
                  checked={Boolean(form.animate_stripes)}
                  onChange={(e) => set('animate_stripes', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="animate_stripes" style={{ fontSize: '0.82rem' }}>
                  Animate Stripes
                </label>
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Order</label>
              <input type="number" className="form-control form-control-sm" min={0} value={form.order_position} onChange={(e) => set('order_position', Number(e.target.value))} />
            </div>
            <div className="col-md-4">
              <label className="form-label" style={{ fontSize: '0.82rem' }}>Status</label>
              <select className="form-select form-select-sm" value={form.status} onChange={(e) => set('status', Number(e.target.value))}>
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Live Preview ── */}
        <div className="col-lg-5 ps-lg-3 pt-3 pt-lg-0 d-flex flex-column">
          <div className="mb-2 d-flex align-items-center gap-2">
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>Live Preview</span>
            <span className="badge bg-light text-secondary border" style={{ fontSize: '0.65rem' }}>updates as you type</span>
          </div>
          <SlidePreview slide={previewSlide} />
          <div className="mt-2" style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
            Actual render may differ slightly based on screen size and animation timing.
          </div>
        </div>
      </div>
    </AppModal>
  );
}
