import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty) {
  return DOMPurify.sanitize(dirty ?? '', {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}
