import { useState } from 'react';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import { SkeletonTable } from '../../../shared/components/Skeleton';
import { useAuth } from '../../../shared/hooks/useAuth';
import {
  useBanners, useBannerConfig,
  useCreateBanner, useUpdateBanner, useDeleteBanner,
  useReorderBanners, useUpdateBannerConfig,
} from '../api';
import SlideFormModal from '../components/SlideFormModal';
import SlidePreview from '../components/SlidePreview';

export default function BannersPage() {
  const { isAdmin, hasPermission } = useAuth();
  const canManage = isAdmin || hasPermission('banners.manage');

  const { data: slides = [], isLoading } = useBanners();
  const { data: config }                 = useBannerConfig();

  const createMut  = useCreateBanner();
  const updateMut  = useUpdateBanner();
  const deleteMut  = useDeleteBanner();
  const reorderMut = useReorderBanners();
  const configMut  = useUpdateBannerConfig();

  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [dragIdx, setDragIdx]       = useState(null);
  const [localSlides, setLocalSlides] = useState(null);

  const displaySlides = localSlides ?? slides;

  // ── Drag-to-reorder ────────────────────────────────────────────────────────
  const onDragStart = (i) => setDragIdx(i);
  const onDragOver  = (e, i) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const reordered = [...displaySlides];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(i, 0, moved);
    setLocalSlides(reordered);
    setDragIdx(i);
  };
  const onDragEnd = () => {
    if (!localSlides) return;
    const payload = localSlides.map((s, i) => ({ id: s.id, order_position: i }));
    reorderMut.mutate(payload, { onSettled: () => { setLocalSlides(null); setDragIdx(null); } });
  };

  // ── Modal handlers ─────────────────────────────────────────────────────────
  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit   = (slide) => { setEditing(slide); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const handleSubmit = (payload) => {
    const mut = editing ? updateMut : createMut;
    mut.mutate(payload, { onSuccess: closeModal });
  };

  const handleDelete = (slide) => {
    Swal.fire({
      title: `Delete "${slide.name}"?`,
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Delete',
    }).then((r) => { if (r.isConfirmed) deleteMut.mutate(slide.id); });
  };

  // ── Config save ────────────────────────────────────────────────────────────
  const handleConfigChange = (k, v) => configMut.mutate({ [k]: v });

  return (
    <div className="app-content">
      <PageHeader
        title="Banner Slides"
        breadcrumb={[{ label: 'E-commerce' }, { label: 'Banners' }]}
        actionLabel={canManage ? 'Add Slide' : undefined}
        onAction={canManage ? openCreate : undefined}
      />

      {/* Global slider config */}
      {config && canManage && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body py-3">
            <div className="d-flex align-items-center gap-4 flex-wrap">
              <strong style={{ fontSize: '0.82rem', color: '#374151' }}>Slider Config</strong>

              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '0.8rem' }}>Autoplay</span>
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={config.autoplay}
                    onChange={(e) => handleConfigChange('autoplay', e.target.checked)}
                  />
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '0.8rem' }}>Delay (ms)</span>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  style={{ width: 90 }}
                  defaultValue={config.autoplay_delay_ms}
                  min={1000} max={30000} step={500}
                  onBlur={(e) => handleConfigChange('autoplay_delay_ms', Number(e.target.value))}
                />
              </div>

              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '0.8rem' }}>Transition</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: 90 }}
                  value={config.transition}
                  onChange={(e) => handleConfigChange('transition', e.target.value)}
                >
                  <option value="fade">Fade</option>
                  <option value="slide">Slide</option>
                </select>
              </div>

              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '0.8rem' }}>Dots</span>
                <div className="form-check form-switch mb-0">
                  <input className="form-check-input" type="checkbox" checked={config.show_dots} onChange={(e) => handleConfigChange('show_dots', e.target.checked)} />
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '0.8rem' }}>Arrows</span>
                <div className="form-check form-switch mb-0">
                  <input className="form-check-input" type="checkbox" checked={config.show_arrows} onChange={(e) => handleConfigChange('show_arrows', e.target.checked)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide list */}
      {isLoading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : displaySlides.length === 0 ? (
        <div className="text-center py-5 text-muted" style={{ fontSize: '0.9rem' }}>
          No slides yet.{canManage && ' Click "Add Slide" to create the first one.'}
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {displaySlides.map((slide, i) => (
            <div
              key={slide.id}
              draggable={canManage}
              onDragStart={() => onDragStart(i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDragEnd={onDragEnd}
              className="card border-0 shadow-sm"
              style={{ cursor: canManage ? 'grab' : 'default', opacity: dragIdx === i ? 0.5 : 1 }}
            >
              <div className="card-body p-3">
                <div className="row align-items-center g-3">
                  {/* Drag handle */}
                  {canManage && (
                    <div className="col-auto text-muted" style={{ fontSize: '1.1rem', cursor: 'grab' }} title="Drag to reorder">
                      <i className="fa-solid fa-grip-vertical" />
                    </div>
                  )}

                  {/* Mini preview */}
                  <div className="col-auto">
                    <div style={{ width: 160, height: 90, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                      <SlidePreview slide={slide} />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="col">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{slide.name}</span>
                      <span className="badge bg-light text-secondary border" style={{ fontSize: '0.68rem' }}>{slide.preset}</span>
                      <span className={`badge ${slide.status === 1 ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.68rem' }}>
                        {slide.status === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {slide.heading && <div style={{ fontSize: '0.8rem', color: '#374151' }}>{slide.heading}</div>}
                    {slide.subheading && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{slide.subheading}</div>}
                  </div>

                  {/* Actions */}
                  {canManage && (
                    <div className="col-auto d-flex gap-2">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => openEdit(slide)}
                        title="Edit"
                      >
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(slide)}
                        title="Delete"
                        disabled={deleteMut.isPending}
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {canManage && (
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
              Drag slides to reorder. Changes save automatically.
            </p>
          )}
        </div>
      )}

      <SlideFormModal
        show={showModal}
        onHide={closeModal}
        onSubmit={handleSubmit}
        initial={editing}
        isLoading={createMut.isPending || updateMut.isPending}
      />
    </div>
  );
}
