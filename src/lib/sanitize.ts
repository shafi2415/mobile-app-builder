import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Removes all script tags, event handlers, and dangerous attributes
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'span'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
};

/**
 * Sanitizes plain text input
 * Strips all HTML tags and encodes special characters
 */
export const sanitizeText = (text: string): string => {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  }).trim();
};

/**
 * Validates that text doesn't contain script tags or suspicious patterns
 */
export const containsMaliciousContent = (text: string): boolean => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onerror, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(text));
};

/**
 * Sanitizes file names to prevent path traversal attacks
 */
export const sanitizeFileName = (fileName: string): string => {
  // Remove path separators and special characters
  return fileName
    .replace(/[\/\\]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 255); // Limit length
};
