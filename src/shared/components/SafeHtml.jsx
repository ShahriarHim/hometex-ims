import { sanitizeHtml } from '../utils/sanitize';

/**
 * Renders server-provided HTML safely via DOMPurify.
 * Use this wherever the old code used dangerouslySetInnerHTML directly.
 *
 * Usage:
 *   <SafeHtml html={product.description} />
 *   <SafeHtml html={product.description} as="span" className="text-muted" />
 */
export default function SafeHtml({ html, as: Tag = 'div', className = '', ...rest }) {
  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      {...rest}
    />
  );
}
