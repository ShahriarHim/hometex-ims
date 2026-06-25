import { useRef, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import ConfirmDialog from '../../../../shared/components/ConfirmDialog';
import { useAuth } from '../../../../shared/hooks/useAuth';
import {
  useProduct,
  useUploadProductPhotos,
  useSetPrimaryPhoto,
  useReorderProductPhotos,
  useDeleteProductPhoto,
} from '../../api';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Upload dropzone strip ────────────────────────────────────────────────────
function UploadZone({ onClick, isPending }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="d-flex align-items-center gap-3 p-3 mb-3 rounded"
      style={{
        border: `1.5px dashed ${hover && !isPending ? '#2563eb' : '#cbd5e1'}`,
        background: hover && !isPending ? '#eff6ff' : '#f8fafc',
        cursor: isPending ? 'wait' : 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        userSelect: 'none',
      }}
      onClick={!isPending ? onClick : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {isPending
        ? <i className="fa-solid fa-spinner fa-spin text-primary" style={{ fontSize: '1.1rem', width: 28, textAlign: 'center' }} />
        : <i className="fa-solid fa-images" style={{ fontSize: '1.1rem', width: 28, textAlign: 'center', color: hover ? '#2563eb' : '#9ca3af', transition: 'color 0.15s' }} />
      }
      <div>
        <div style={{ fontSize: '0.825rem', fontWeight: 600, color: isPending ? '#6b7280' : hover ? '#1d4ed8' : '#374151', transition: 'color 0.15s' }}>
          {isPending ? 'Uploading…' : 'Click to add photos'}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 1 }}>
          PNG, JPG, WEBP · Multiple files supported
        </div>
      </div>
    </div>
  );
}

// ─── Single photo card with hover overlay ────────────────────────────────────
function PhotoCard({ src, alt, isPrimary, canEdit, onSetPrimary, onDelete, draggable, onDragStart, onDragOver, onDragEnd, isDragging, isPendingMode, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="col-6 col-sm-4 col-md-3"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      style={{ opacity: isDragging ? 0.3 : 1, transition: 'opacity 0.15s' }}
    >
      <div
        style={{
          borderRadius: 8,
          overflow: 'hidden',
          border: isPrimary ? '2.5px solid #2563eb' : '1.5px solid #e5e7eb',
          boxShadow: isPrimary ? '0 0 0 3px rgba(37,99,235,0.15)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          background: '#f1f5f9',
          cursor: draggable ? 'grab' : 'default',
          position: 'relative',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image — 4:3 aspect ratio */}
        <div style={{ paddingTop: '75%', position: 'relative' }}>
          <img
            src={src}
            alt={alt || 'product'}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
              transition: 'filter 0.2s',
              filter: hovered && canEdit ? 'brightness(0.55)' : 'none',
            }}
          />

          {/* Primary badge — always visible when primary */}
          {isPrimary && (
            <span style={{
              position: 'absolute', top: 7, left: 7,
              background: '#2563eb', color: '#fff',
              fontSize: '0.6rem', padding: '2px 8px',
              borderRadius: 4, fontWeight: 700,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              zIndex: 2,
            }}>
              Primary
            </span>
          )}

          {/* Hover overlay — action buttons */}
          {canEdit && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 8,
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.2s',
              zIndex: 3,
              pointerEvents: hovered ? 'auto' : 'none',
            }}>
              {/* Set primary button (edit mode only) */}
              {onSetPrimary && !isPrimary && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSetPrimary(); }}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1.5px solid rgba(255,255,255,0.7)',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '5px 12px',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                    transition: 'background 0.15s',
                    display: 'flex', alignItems: 'center', gap: 5,
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(37,99,235,0.7)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                >
                  <i className="fa-regular fa-star" />
                  Set Primary
                </button>
              )}
              {isPrimary && onSetPrimary && (
                <span style={{
                  background: 'rgba(37,99,235,0.8)',
                  border: '1.5px solid rgba(255,255,255,0.5)',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '5px 12px',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <i className="fa-solid fa-star" />
                  Primary
                </span>
              )}

              {/* Delete button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1.5px solid rgba(255,255,255,0.7)',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '5px 12px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                  transition: 'background 0.15s',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(220,38,38,0.75)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
              >
                <i className="fa-solid fa-trash-can" />
                Remove
              </button>
            </div>
          )}

          {/* Pending mode: position label bottom-left */}
          {isPendingMode && (
            <div style={{
              position: 'absolute', bottom: 6, left: 7,
              fontSize: '0.65rem', fontWeight: 700,
              color: index === 0 ? '#2563eb' : 'rgba(255,255,255,0.8)',
              background: index === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.45)',
              padding: '1px 6px', borderRadius: 4,
              zIndex: 2,
            }}>
              {index === 0 ? 'Primary' : `#${index + 1}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Create mode ─────────────────────────────────────────────────────────────
function PendingPhotosTab({ onPendingChange }) {
  const { isAdmin, hasPermission } = useAuth();
  const canEdit = isAdmin || hasPermission('products.edit');
  const fileInputRef = useRef(null);
  const [pending, setPending] = useState([]);

  const notify = (next) => {
    onPendingChange?.(next.map((p, idx) => ({ photo: p.b64, is_primary: idx === 0 ? 1 : 0, serial: idx })));
  };

  const handleFileChange = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    const encoded = await Promise.all(files.map(fileToBase64));
    const added = encoded.map((b64, i) => ({ previewUrl: b64, b64, name: files[i].name }));
    setPending((prev) => {
      const next = [...prev, ...added];
      notify(next);
      return next;
    });
  }, [onPendingChange]);

  const remove = (idx) => {
    setPending((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      notify(next);
      return next;
    });
  };

  const removeAll = () => {
    setPending([]);
    onPendingChange?.([]);
  };

  if (!canEdit) return (
    <div className="text-muted py-4 text-center" style={{ fontSize: '0.875rem' }}>
      You don't have permission to manage photos.
    </div>
  );

  return (
    <div>
      <UploadZone onClick={() => fileInputRef.current?.click()} isPending={false} />
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="d-none" onChange={handleFileChange} />

      {pending.length > 0 && (
        <>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
              {pending.length} photo{pending.length !== 1 ? 's' : ''} queued
              <span style={{ fontSize: '0.72rem', fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>
                First photo is primary · Will upload on save
              </span>
            </span>
            <button
              type="button"
              onClick={removeAll}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: '0.75rem', color: '#ef4444', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <i className="fa-solid fa-trash-can" />
              Remove all
            </button>
          </div>
          <div className="row g-3">
            {pending.map((p, i) => (
              <PhotoCard
                key={i}
                src={p.previewUrl}
                alt={p.name}
                isPrimary={i === 0}
                canEdit
                onSetPrimary={null}
                onDelete={() => remove(i)}
                draggable={false}
                isPendingMode
                index={i}
              />
            ))}
          </div>
        </>
      )}

      {pending.length === 0 && (
        <div className="text-center py-3 text-muted" style={{ fontSize: '0.8rem' }}>
          No photos added yet. Photos will upload when you save the product.
        </div>
      )}
    </div>
  );
}

// ─── Edit mode ────────────────────────────────────────────────────────────────
export default function PhotosTab({ productId, onPendingChange }) {
  const { isAdmin, hasPermission } = useAuth();
  const canEdit = isAdmin || hasPermission('products.edit');

  const fileInputRef = useRef(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [dragIdx, setDragIdx]     = useState(null);
  const [localPhotos, setLocalPhotos] = useState(null);

  const { data: product } = useProduct(productId);
  const uploadMut  = useUploadProductPhotos(productId);
  const primaryMut = useSetPrimaryPhoto(productId);
  const reorderMut = useReorderProductPhotos(productId);
  const deleteMut  = useDeleteProductPhoto(productId);

  const savedPhotos   = product?.photos ?? [];
  const displayPhotos = localPhotos ?? savedPhotos;

  const handleFileChange = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    const encoded = await Promise.all(files.map(fileToBase64));
    const photos = encoded.map((b64, i) => ({
      photo: b64,
      is_primary: i === 0 && savedPhotos.length === 0 ? 1 : 0,
      serial: savedPhotos.length + i,
    }));
    uploadMut.mutate(photos);
  }, [savedPhotos.length, uploadMut]);

  const handleDeleteAll = async () => {
    const ids = savedPhotos.map((p) => p.id);
    await Promise.allSettled(ids.map((id) => deleteMut.mutateAsync(id)));
    setConfirmDeleteAll(false);
  };

  const onDragStart = (i) => setDragIdx(i);
  const onDragOver  = (e, i) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const reordered = [...displayPhotos];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(i, 0, moved);
    setLocalPhotos(reordered);
    setDragIdx(i);
  };
  const onDragEnd = () => {
    if (!localPhotos) { setDragIdx(null); return; }
    const payload = localPhotos.map((p, i) => ({ id: p.id, position: i }));
    reorderMut.mutate(payload, { onSettled: () => { setLocalPhotos(null); setDragIdx(null); } });
  };

  const handleSetPrimary = (photo) => {
    if (photo.is_primary) return;
    Swal.fire({
      title: 'Set as primary image?',
      text: 'This will be the main product image shown in listings.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Set Primary',
    }).then((r) => { if (r.isConfirmed) primaryMut.mutate(photo.id); });
  };

  if (!productId) {
    return <PendingPhotosTab onPendingChange={onPendingChange} />;
  }

  return (
    <div>
      {canEdit && (
        <>
          <UploadZone onClick={() => fileInputRef.current?.click()} isPending={uploadMut.isPending} />
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="d-none" onChange={handleFileChange} />
        </>
      )}

      <div className="d-flex align-items-center justify-content-between mb-3">
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
          {displayPhotos.length} photo{displayPhotos.length !== 1 ? 's' : ''}
          {canEdit && displayPhotos.length > 1 && (
            <span style={{ fontSize: '0.72rem', fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>
              <i className="fa-solid fa-up-down-left-right me-1" />Drag to reorder
            </span>
          )}
        </span>
        {canEdit && displayPhotos.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmDeleteAll(true)}
            disabled={deleteMut.isPending}
            style={{
              background: 'none', border: 'none', padding: 0,
              fontSize: '0.75rem', color: '#ef4444', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <i className="fa-solid fa-trash-can" />
            Delete all
          </button>
        )}
      </div>

      {displayPhotos.length === 0 ? (
        <div className="text-center py-4 text-muted" style={{ fontSize: '0.875rem' }}>
          No photos yet.{canEdit && ' Upload some above.'}
        </div>
      ) : (
        <div className="row g-3">
          {displayPhotos.map((photo, i) => (
            <PhotoCard
              key={photo.id}
              src={photo.thumbnail || photo.url}
              alt={photo.alt_text || 'product'}
              isPrimary={!!photo.is_primary}
              canEdit={canEdit}
              onSetPrimary={() => handleSetPrimary(photo)}
              onDelete={() => setDeleteTarget(photo.id)}
              draggable={canEdit && displayPhotos.length > 1}
              onDragStart={() => onDragStart(i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDragEnd={onDragEnd}
              isDragging={dragIdx === i}
              isPendingMode={false}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Delete single */}
      <ConfirmDialog
        show={deleteTarget !== null}
        title="Delete Photo"
        message="Delete this photo? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMut.isPending}
        onConfirm={() => deleteMut.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Delete all */}
      <ConfirmDialog
        show={confirmDeleteAll}
        title="Delete All Photos"
        message={`Delete all ${savedPhotos.length} photos? This cannot be undone.`}
        confirmLabel="Delete All"
        variant="danger"
        isLoading={deleteMut.isPending}
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmDeleteAll(false)}
      />
    </div>
  );
}
