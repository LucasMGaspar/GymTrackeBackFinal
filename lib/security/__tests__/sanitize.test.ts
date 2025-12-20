import {
  sanitizeContent,
  sanitizeWithLineBreaks,
  isValidUUID,
  sanitizeEmail,
  sanitizeString,
} from '../sanitize';

describe('sanitizeContent', () => {
  it('should remove HTML tags', () => {
    const input = '<p>Hello <strong>World</strong></p>';
    const result = sanitizeContent(input);
    expect(result).toBe('Hello World');
  });

  it('should remove script tags', () => {
    const input = '<script>alert("XSS")</script>Hello';
    const result = sanitizeContent(input);
    expect(result).toBe('Hello');
  });

  it('should remove iframe tags', () => {
    const input = '<iframe src="evil.com"></iframe>Safe content';
    const result = sanitizeContent(input);
    expect(result).toBe('Safe content');
  });

  it('should remove event handlers', () => {
    const input = '<div onclick="alert(\'XSS\')">Click me</div>';
    const result = sanitizeContent(input);
    expect(result).toBe('Click me');
  });

  it('should handle empty string', () => {
    const result = sanitizeContent('');
    expect(result).toBe('');
  });

  it('should handle plain text', () => {
    const input = 'Just plain text';
    const result = sanitizeContent(input);
    expect(result).toBe('Just plain text');
  });

  it('should remove nested HTML', () => {
    const input = '<div><span><p>Nested</p></span></div>';
    const result = sanitizeContent(input);
    expect(result).toBe('Nested');
  });
});

describe('sanitizeWithLineBreaks', () => {
  it('should preserve line breaks', () => {
    const input = 'Line 1\nLine 2\nLine 3';
    const result = sanitizeWithLineBreaks(input);
    expect(result).toBe('Line 1\nLine 2\nLine 3');
  });

  it('should remove HTML but keep line breaks', () => {
    const input = '<p>Line 1</p>\n<p>Line 2</p>';
    const result = sanitizeWithLineBreaks(input);
    expect(result).toBe('Line 1\nLine 2');
  });

  it('should handle empty string', () => {
    const result = sanitizeWithLineBreaks('');
    expect(result).toBe('');
  });

  it('should handle text without line breaks', () => {
    const input = 'Single line text';
    const result = sanitizeWithLineBreaks(input);
    expect(result).toBe('Single line text');
  });
});

describe('isValidUUID', () => {
  it('should validate correct UUID v4', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    expect(isValidUUID(validUUID)).toBe(true);
  });

  it('should validate UUID with uppercase', () => {
    const validUUID = '550E8400-E29B-41D4-A716-446655440000';
    expect(isValidUUID(validUUID)).toBe(true);
  });

  it('should reject invalid UUID format', () => {
    const invalidUUID = 'not-a-uuid';
    expect(isValidUUID(invalidUUID)).toBe(false);
  });

  it('should reject UUID with wrong length', () => {
    const invalidUUID = '550e8400-e29b-41d4-a716';
    expect(isValidUUID(invalidUUID)).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidUUID('')).toBe(false);
  });

  it('should reject UUID with wrong separators', () => {
    const invalidUUID = '550e8400_e29b_41d4_a716_446655440000';
    expect(isValidUUID(invalidUUID)).toBe(false);
  });

  it('should reject SQL injection attempt', () => {
    const sqlInjection = "'; DROP TABLE users; --";
    expect(isValidUUID(sqlInjection)).toBe(false);
  });

  it('should reject XSS attempt', () => {
    const xssAttempt = '<script>alert("xss")</script>';
    expect(isValidUUID(xssAttempt)).toBe(false);
  });
});

describe('sanitizeEmail', () => {
  it('should lowercase email', () => {
    const email = 'TEST@EXAMPLE.COM';
    const result = sanitizeEmail(email);
    expect(result).toBe('test@example.com');
  });

  it('should trim whitespace', () => {
    const email = '  test@example.com  ';
    const result = sanitizeEmail(email);
    expect(result).toBe('test@example.com');
  });

  it('should handle mixed case with spaces', () => {
    const email = '  Test@Example.COM  ';
    const result = sanitizeEmail(email);
    expect(result).toBe('test@example.com');
  });

  it('should handle empty string', () => {
    const result = sanitizeEmail('');
    expect(result).toBe('');
  });
});

describe('sanitizeString', () => {
  it('should trim whitespace', () => {
    const input = '  hello world  ';
    const result = sanitizeString(input);
    expect(result).toBe('hello world');
  });

  it('should remove control characters', () => {
    const input = 'Hello\x00World\x1FTest';
    const result = sanitizeString(input);
    expect(result).toBe('HelloWorldTest');
  });

  it('should limit length when maxLength provided', () => {
    const input = 'This is a very long string';
    const result = sanitizeString(input, 10);
    expect(result).toBe('This is a ');
  });

  it('should not limit when maxLength is greater than string length', () => {
    const input = 'Short';
    const result = sanitizeString(input, 100);
    expect(result).toBe('Short');
  });

  it('should handle empty string', () => {
    const result = sanitizeString('');
    expect(result).toBe('');
  });

  it('should handle string with only control characters', () => {
    const input = '\x00\x01\x02\x03';
    const result = sanitizeString(input);
    expect(result).toBe('');
  });

  it('should preserve normal characters', () => {
    const input = 'Hello World 123 !@#$%';
    const result = sanitizeString(input);
    expect(result).toBe('Hello World 123 !@#$%');
  });

  it('should handle newlines and tabs', () => {
    const input = 'Line 1\nLine 2\tTab';
    const result = sanitizeString(input);
    // Newlines and tabs are control characters, so they should be removed
    expect(result).toBe('Line 1Line 2Tab');
  });
});

