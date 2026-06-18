import DOMPurify from 'dompurify';

const EMAIL_HTML_CONFIG: DOMPurify.Config = {
  USE_PROFILES: { html: true },
  ADD_ATTR: ['target', 'bgcolor', 'align', 'valign', 'cellpadding', 'cellspacing', 'border'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'base', 'link', 'meta'],
  FORBID_ATTR: [
    'onerror',
    'onload',
    'onclick',
    'onmouseover',
    'onfocus',
    'onblur',
    'onkeyup',
    'onkeydown',
    'onmousedown',
    'onmouseup',
    'oninput',
    'onchange',
    'onsubmit',
  ],
  ALLOW_DATA_ATTR: false,
};

/** Strip scripts, event handlers, and other dangerous markup from email HTML. */
export function sanitizeEmailHtml(html: string): string {
  return DOMPurify.sanitize(html, EMAIL_HTML_CONFIG);
}
