import { Modal, Button } from 'react-bootstrap';

/**
 * General-purpose modal wrapper for create/edit dialogs.
 *
 * Usage:
 *   <AppModal
 *     show={show}
 *     title="Add Brand"
 *     onHide={() => setShow(false)}
 *     onSubmit={handleSubmit}
 *     submitLabel="Save"
 *     isLoading={mutation.isPending}
 *   >
 *     <FormField ... />
 *   </AppModal>
 *
 * Props:
 *   show         boolean
 *   title        string
 *   onHide       () => void
 *   onSubmit     () => void  — if omitted, no submit button is rendered
 *   submitLabel  string      (default "Save")
 *   submitVariant string     Bootstrap variant (default "primary")
 *   isLoading    boolean
 *   size         'sm'|'lg'|'xl'  (default undefined = medium)
 *   children     ReactNode
 *   footer       ReactNode   — override entire footer if needed
 */
export default function AppModal({
  show,
  title,
  onHide,
  onSubmit,
  submitLabel = 'Save',
  submitVariant = 'primary',
  isLoading = false,
  size,
  children,
  footer,
}) {
  return (
    <Modal show={show} onHide={onHide} size={size} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6">{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>{children}</Modal.Body>

      <Modal.Footer>
        {footer ?? (
          <>
            <Button variant="secondary" size="sm" onClick={onHide} disabled={isLoading}>
              Cancel
            </Button>
            {onSubmit && (
              <Button
                variant={submitVariant}
                size="sm"
                onClick={onSubmit}
                disabled={isLoading}
              >
                {isLoading && (
                  <span className="spinner-border spinner-border-sm me-1" role="status" />
                )}
                {submitLabel}
              </Button>
            )}
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
}
