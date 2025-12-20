import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS } from '../rate-limit';
import { 
  logRateLimit, 
  updateRateLimitStats, 
  getRateLimitStats, 
  resetRateLimitStats,
  logRateLimitStatsSummary 
} from '../rate-limit-logger';

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
  // Reset environment
  process.env.NODE_ENV = 'test';
  delete process.env.DEBUG_RATE_LIMIT;
  // Reset stats
  resetRateLimitStats();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
  resetRateLimitStats();
});

describe('rateLimit', () => {
  const createMockRequest = (ip: string = '127.0.0.1', pathname: string = '/api/test'): NextRequest => {
    const url = new URL(`http://localhost${pathname}`);
    const headers = new Headers();
    headers.set('x-forwarded-for', ip);
    
    return {
      ip,
      method: 'GET',
      nextUrl: url,
      headers,
    } as unknown as NextRequest;
  };

  it('should allow request when under limit', () => {
    const request = createMockRequest('127.0.0.1');
    const result = rateLimit(request, 10, 60000);
    
    expect(result).toBeNull();
  });

  it('should block request when limit exceeded', () => {
    const request = createMockRequest('127.0.0.1');
    const maxRequests = 2;
    
    // Make requests up to the limit
    for (let i = 0; i < maxRequests; i++) {
      const result = rateLimit(request, maxRequests, 60000);
      expect(result).toBeNull();
    }
    
    // Next request should be blocked
    const blockedResult = rateLimit(request, maxRequests, 60000);
    expect(blockedResult).not.toBeNull();
    expect(blockedResult).toBeInstanceOf(NextResponse);
    
    if (blockedResult instanceof NextResponse) {
      expect(blockedResult.status).toBe(429);
    }
  });

  it('should include rate limit headers in response', () => {
    const request = createMockRequest('127.0.0.1');
    const maxRequests = 1;
    
    // Exceed limit
    rateLimit(request, maxRequests, 60000);
    const blockedResult = rateLimit(request, maxRequests, 60000);
    
    expect(blockedResult).not.toBeNull();
    if (blockedResult instanceof NextResponse) {
      const headers = blockedResult.headers;
      expect(headers.get('X-RateLimit-Limit')).toBe(String(maxRequests));
      expect(headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(headers.has('Retry-After')).toBe(true);
      expect(headers.has('X-RateLimit-Reset')).toBe(true);
    }
  });

  it('should reset limit after window expires', async () => {
    const request = createMockRequest('127.0.0.1');
    const maxRequests = 1;
    const windowMs = 100; // 100ms for testing
    
    // Exceed limit
    rateLimit(request, maxRequests, windowMs);
    const blockedResult = rateLimit(request, maxRequests, windowMs);
    expect(blockedResult).not.toBeNull();
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Should allow again
    const allowedResult = rateLimit(request, maxRequests, windowMs);
    expect(allowedResult).toBeNull();
  });

  it('should handle different IPs separately', () => {
    const request1 = createMockRequest('127.0.0.1');
    const request2 = createMockRequest('192.168.1.1');
    const maxRequests = 1;
    
    // Exceed limit for IP1
    rateLimit(request1, maxRequests, 60000);
    const blocked1 = rateLimit(request1, maxRequests, 60000);
    expect(blocked1).not.toBeNull();
    
    // IP2 should still be allowed
    const allowed2 = rateLimit(request2, maxRequests, 60000);
    expect(allowed2).toBeNull();
  });

  it('should use x-forwarded-for header when IP not available', () => {
    const headers = new Headers();
    headers.set('x-forwarded-for', '192.168.1.100');
    
    const request = {
      ip: undefined,
      method: 'GET',
      nextUrl: new URL('http://localhost/api/test'),
      headers,
    } as unknown as NextRequest;
    
    const result = rateLimit(request, 10, 60000);
    expect(result).toBeNull();
  });

  it('should use x-real-ip header as fallback', () => {
    const headers = new Headers();
    headers.set('x-real-ip', '10.0.0.1');
    
    const request = {
      ip: undefined,
      method: 'GET',
      nextUrl: new URL('http://localhost/api/test'),
      headers,
    } as unknown as NextRequest;
    
    const result = rateLimit(request, 10, 60000);
    expect(result).toBeNull();
  });

  it('should use "unknown" when no IP available', () => {
    const headers = new Headers();
    
    const request = {
      ip: undefined,
      method: 'GET',
      nextUrl: new URL('http://localhost/api/test'),
      headers,
    } as unknown as NextRequest;
    
    const result = rateLimit(request, 10, 60000);
    expect(result).toBeNull();
  });

  it('should log rate limit exceeded in production', () => {
    process.env.NODE_ENV = 'production';
    const request = createMockRequest('127.0.0.1');
    const maxRequests = 1;
    
    rateLimit(request, maxRequests, 60000);
    const blockedResult = rateLimit(request, maxRequests, 60000);
    
    expect(blockedResult).not.toBeNull();
    expect(console.error).toHaveBeenCalled();
    const errorCall = (console.error as jest.Mock).mock.calls[0];
    expect(errorCall[0]).toBe('[RATE_LIMIT_EXCEEDED]');
  });

  it('should include endpoint and method in log', () => {
    process.env.NODE_ENV = 'production';
    const request = createMockRequest('127.0.0.1', '/api/comments');
    const maxRequests = 1;
    
    rateLimit(request, maxRequests, 60000);
    rateLimit(request, maxRequests, 60000);
    
    expect(console.error).toHaveBeenCalled();
    const errorCall = (console.error as jest.Mock).mock.calls[0];
    const logData = JSON.parse(errorCall[1]);
    expect(logData.endpoint).toBe('/api/comments');
    expect(logData.method).toBe('GET');
    expect(logData.ip).toBe('127.0.0.1');
    expect(logData.status).toBe('blocked');
  });

  it('should update stats when rate limit is exceeded', () => {
    const request = createMockRequest('127.0.0.1', '/api/test');
    const maxRequests = 1;
    
    rateLimit(request, maxRequests, 60000);
    rateLimit(request, maxRequests, 60000);
    
    const stats = getRateLimitStats();
    expect(stats.totalRequests).toBeGreaterThan(0);
    expect(stats.blockedRequests).toBeGreaterThan(0);
    expect(stats.uniqueIPs.has('127.0.0.1')).toBe(true);
  });

  it('should track top blocked IPs', () => {
    const request1 = createMockRequest('192.168.1.1');
    const request2 = createMockRequest('192.168.1.2');
    const maxRequests = 1;
    
    // Block IP1 twice
    rateLimit(request1, maxRequests, 60000);
    rateLimit(request1, maxRequests, 60000);
    
    // Block IP2 once
    rateLimit(request2, maxRequests, 60000);
    rateLimit(request2, maxRequests, 60000);
    
    const stats = getRateLimitStats();
    const ip1Count = stats.topBlockedIPs.get('192.168.1.1') || 0;
    const ip2Count = stats.topBlockedIPs.get('192.168.1.2') || 0;
    
    expect(ip1Count).toBeGreaterThan(0);
    expect(ip2Count).toBeGreaterThan(0);
  });

  it('should track top blocked endpoints', () => {
    const request1 = createMockRequest('127.0.0.1', '/api/comments');
    const request2 = createMockRequest('127.0.0.1', '/api/exercises');
    const maxRequests = 1;
    
    // Block comments endpoint
    rateLimit(request1, maxRequests, 60000);
    rateLimit(request1, maxRequests, 60000);
    
    // Block exercises endpoint
    rateLimit(request2, maxRequests, 60000);
    rateLimit(request2, maxRequests, 60000);
    
    const stats = getRateLimitStats();
    expect(stats.topBlockedEndpoints.has('/api/comments')).toBe(true);
    expect(stats.topBlockedEndpoints.has('/api/exercises')).toBe(true);
  });

  it('should handle x-forwarded-for with multiple IPs', () => {
    const headers = new Headers();
    headers.set('x-forwarded-for', '192.168.1.1, 10.0.0.1, 172.16.0.1');
    
    const request = {
      ip: undefined,
      method: 'GET',
      nextUrl: new URL('http://localhost/api/test'),
      headers,
    } as unknown as NextRequest;
    
    const result = rateLimit(request, 10, 60000);
    expect(result).toBeNull();
  });
});

describe('RATE_LIMITS constants', () => {
  it('should have correct write limits', () => {
    expect(RATE_LIMITS.write.maxRequests).toBe(20);
    expect(RATE_LIMITS.write.windowMs).toBe(60000);
  });

  it('should have correct read limits', () => {
    expect(RATE_LIMITS.read.maxRequests).toBe(100);
    expect(RATE_LIMITS.read.windowMs).toBe(60000);
  });

  it('should have correct auth limits', () => {
    expect(RATE_LIMITS.auth.maxRequests).toBe(5);
    expect(RATE_LIMITS.auth.windowMs).toBe(60000);
  });

  it('should have correct whatsapp limits', () => {
    expect(RATE_LIMITS.whatsapp.maxRequests).toBe(10);
    expect(RATE_LIMITS.whatsapp.windowMs).toBe(60000);
  });
});

