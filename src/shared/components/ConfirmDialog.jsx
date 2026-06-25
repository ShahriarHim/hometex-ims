import { Modal, Button } from 'react-bootstrap';

/**
 * Reusable confirmation dialog. Replaces ad-hoc SweetAlert2 confirm calls.
 * (Keep SweetAlert2 for toasts/success notifications — only replace confirm dialogs.)
 *
 * Usage:
 *   const [show, setShow] = useState(false);
 *   <ConfirmDialog
 *     show={show}
 *     title="Delete product?"
 *     message="This cannot be undone."
 *     confirmLabel="Delete"
 *     variant="danger"
 *     isLoading={deleteMutation.isPending}
 *     onConfirm={() => deleteMutation.mutate(id)}
 *     onCancel={() => setShow(false)}
 *   />
 *
 * Props:
 *   show         boolean
 *   title        string
 *   message      string | ReactNode
 *   confirmLabel string   (default "Confirm")
 *   cancelLabel  string   (default "Cancel")
 *   variant      string   Bootstrap button variant for confirm btn (default "danger")
 *   isLoading    boolean  disables confirm btn and shows spinner
 *   onConfirm    () => void
 *   onCancel     () => void
 */
export default function ConfirmDialog({
  show,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal show={show} onHide={onCancel} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title className="fs-6">{title}</Modal.Title>
      </Modal.Header>
      {message && <Modal.Body className="text-muted">{message}</Modal.Body>}
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button variant={variant} size="sm" onClick={onConfirm} disabled={isLoading}>
          {isLoading && (
            <span className="spinner-border spinner-border-sm me-1" role="status" />
          )}
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
