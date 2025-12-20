import {
  logRateLimit,
  updateRateLimitStats,
  getRateLimitStats,
  resetRateLimitStats,
  logRateLimitStatsSummary,
  type RateLimitLogEntry,
} from '../rate-limit-logger';

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeEach(() => {
  console.error = jest.fn();
  console.log = jest.fn();
  resetRateLimitStats();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
  resetRateLimitStats();
});

describe('rate-limit-logger', () => {
  describe('logRateLimit', () => {
    it('should log blocked requests in production', () => {
      process.env.NODE_ENV = 'production';
      
      const entry: RateLimitLogEntry = {
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
        endpoint: '/api/test',
        method: 'GET',
        maxRequests: 10,
        currentCount: 10,
        windowMs: 60000,
        retryAfter: 30,
        status: 'blocked',
      };

      logRateLimit(entry);

      expect(console.error).toHaveBeenCalled();
      const errorCall = (console.error as jest.Mock).mock.calls[0];
      expect(errorCall[0]).toBe('[RATE_LIMIT_EXCEEDED]');
      expect(JSON.parse(errorCall[1])).toMatchObject({
        ip: '127.0.0.1',
        endpoint: '/api/test',
        status: 'blocked',
      });
    });

    it('should log in development mode when DEBUG_RATE_LIMIT is true', () => {
      process.env.NODE_ENV = 'development';
      process.env.DEBUG_RATE_LIMIT = 'true';

      const entry: RateLimitLogEntry = {
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
        endpoint: '/api/test',
        method: 'GET',
        maxRequests: 10,
        currentCount: 5,
        windowMs: 60000,
        retryAfter: 0,
        status: 'allowed',
      };

      logRateLimit(entry);

      expect(console.log).toHaveBeenCalled();
    });

    it('should not log allowed requests in production without debug mode', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DEBUG_RATE_LIMIT;

      const entry: RateLimitLogEntry = {
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
        endpoint: '/api/test',
        method: 'GET',
        maxRequests: 10,
        currentCount: 5,
        windowMs: 60000,
        retryAfter: 0,
        status: 'allowed',
      };

      logRateLimit(entry);

      expect(console.log).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should log new session in debug mode', () => {
      process.env.NODE_ENV = 'development';
      process.env.DEBUG_RATE_LIMIT = 'true';

      const entry: RateLimitLogEntry = {
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
        endpoint: '/api/test',
        method: 'GET',
        maxRequests: 10,
        currentCount: 1,
        windowMs: 60000,
        retryAfter: 0,
        status: 'new_session',
      };

      logRateLimit(entry);

      expect(console.log).toHaveBeenCalled();
      const logCall = (console.log as jest.Mock).mock.calls[0];
      expect(logCall[0]).toContain('NEW SESSION');
    });
  });

  describe('updateRateLimitStats', () => {
    it('should update stats for blocked requests', () => {
      const entry: RateLimitLogEntry = {
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
        endpoint: '/api/test',
        method: 'GET',
        maxRequests: 10,
        currentCount: 10,
        windowMs: 60000,
        retryAfter: 30,
        status: 'blocked',
      };

      updateRateLimitStats(entry);

      const stats = getRateLimitStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.blockedRequests).toBe(1);
      expect(stats.allowedRequests).toBe(0);
      expect(stats.uniqueIPs.has('127.0.0.1')).toBe(true);
    });

    it('should update stats for allowed requests', () => {
      const entry: RateLimitLogEntry = {
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
        endpoint: '/api/test',
        method: 'GET',
        maxRequests: 10,
        currentCount: 5,
        windowMs: 60000,
        retryAfter: 0,
        status: 'allowed',
      };

      updateRateLimitStats(entry);

      const stats = getRateLimitStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.blockedRequests).toBe(0);
      expect(stats.allowedRequests).toBe(1);
    });

    it('should track multiple blocked IPs', () => {
      const entry1: RateLimitLogEntry = {
        timestamp: new Date().toISOString(),
        ip: '192.168.1.1',
        endpoint: '/api/test',
        method: 'GET',
        maxRequests: 10,
        currentCount: 10,
        windowMs: 60000,
        retryAfter: 30,
        status: 'blocked',
      };

      const entry2: RateLimitLogEntry = {
        ...entry1,
        ip: '192.168.1.2',
      };

      updateRateLimitStats(entry1);
      updateRateLimitStats(entry2);

      const stats = getRateLimitStats();
      expect(stats.uniqueIPs.size).toBe(2);
      expect(stats.topBlockedIPs.get('192.168.1.1')).toBe(1);
      expect(stats.topBlockedIPs.get('192.168.1.2')).toBe(1);
    });

    it('should increment count for same IP blocked multiple times', () => {
      const entry: RateLimitLogEntry = {
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
        endpoint: '/api/test',
        method: 'GET',
        maxRequests: 10,
        currentCount: 10,
        windowMs: 60000,
        retryAfter: 30,
        status: 'blocked',
      };

      updateRateLimitStats(entry);
      updateRateLimitStats(entry);
      updateRateLimitStats(entry);

      const stats = getRateLimitStats();
      expect(stats.topBlockedIPs.get('127.0.0.1')).toBe(3);
    });

    it('should track top blocked endpoints', () => {
      const entry1: RateLimitLogEntry = {
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
        endpoint: '/api/comments',
        method: 'GET',
        maxRequests: 10,
        currentCount: 10,
        windowMs: 60000,
        retryAfter: 30,
        status: 'blocked',
      };

      const entry2: RateLimitLogEntry = {
        ...entry1,
        endpoint: '/api/exercises',
      };

      updateRateLimitStats(entry1);
      updateRateLimitStats(entry2);
      updateRateLimitStats(entry1); // Block comments again

      const stats = getRateLimitStats();
      expect(stats.topBlockedEndpoints.get('/api/comments')).toBe(2);
      expect(stats.topBlockedEndpoints.get('/api/exercises')).toBe(1);
    });
  });

  describe('getRateLimitStats', () => {
    it('should return cloned stats to prevent mutation', () => {
      const entry: RateLimitLogEntry = {
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
        endpoint: '/api/test',
        method: 'GET',
        maxRequests: 10,
        currentCount: 10,
        windowMs: 60000,
        retryAfter: 30,
        status: 'blocked',
      };

      updateRateLimitStats(entry);

      const stats1 = getRateLimitStats();
      const stats2 = getRateLimitStats();

      // Modify stats1
      stats1.uniqueIPs.add('192.168.1.1');

      // stats2 should not be affected
      expect(stats2.uniqueIPs.has('192.168.1.1')).toBe(false);
    });
  });

  describe('resetRateLimitStats', () => {
    it('should reset all stats', () => {
      const entry: RateLimitLogEntry = {
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
        endpoint: '/api/test',
        method: 'GET',
        maxRequests: 10,
        currentCount: 10,
        windowMs: 60000,
        retryAfter: 30,
        status: 'blocked',
      };

      updateRateLimitStats(entry);

      let stats = getRateLimitStats();
      expect(stats.totalRequests).toBe(1);

      resetRateLimitStats();

      stats = getRateLimitStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.blockedRequests).toBe(0);
      expect(stats.allowedRequests).toBe(0);
      expect(stats.uniqueIPs.size).toBe(0);
      expect(stats.topBlockedIPs.size).toBe(0);
      expect(stats.topBlockedEndpoints.size).toBe(0);
    });
  });

  describe('logRateLimitStatsSummary', () => {
    it('should log summary with correct format', () => {
      const entry1: RateLimitLogEntry = {
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
        endpoint: '/api/test',
        method: 'GET',
        maxRequests: 10,
        currentCount: 10,
        windowMs: 60000,
        retryAfter: 30,
        status: 'blocked',
      };

      const entry2: RateLimitLogEntry = {
        ...entry1,
        status: 'allowed',
      };

      updateRateLimitStats(entry1);
      updateRateLimitStats(entry2);

      logRateLimitStatsSummary();

      expect(console.log).toHaveBeenCalled();
      const logCall = (console.log as jest.Mock).mock.calls[0];
      expect(logCall[0]).toBe('[RATE_LIMIT_STATS]');
      
      const summary = JSON.parse(logCall[1]);
      expect(summary).toHaveProperty('totalRequests');
      expect(summary).toHaveProperty('blockedRequests');
      expect(summary).toHaveProperty('allowedRequests');
      expect(summary).toHaveProperty('blockRate');
      expect(summary).toHaveProperty('uniqueIPs');
      expect(summary).toHaveProperty('topBlockedIPs');
      expect(summary).toHaveProperty('topBlockedEndpoints');
    });

    it('should calculate block rate correctly', () => {
      // 2 blocked, 3 allowed = 40% block rate
      for (let i = 0; i < 2; i++) {
        updateRateLimitStats({
          timestamp: new Date().toISOString(),
          ip: '127.0.0.1',
          endpoint: '/api/test',
          method: 'GET',
          maxRequests: 10,
          currentCount: 10,
          windowMs: 60000,
          retryAfter: 30,
          status: 'blocked',
        });
      }

      for (let i = 0; i < 3; i++) {
        updateRateLimitStats({
          timestamp: new Date().toISOString(),
          ip: '127.0.0.1',
          endpoint: '/api/test',
          method: 'GET',
          maxRequests: 10,
          currentCount: 5,
          windowMs: 60000,
          retryAfter: 0,
          status: 'allowed',
        });
      }

      logRateLimitStatsSummary();

      const logCall = (console.log as jest.Mock).mock.calls[0];
      const summary = JSON.parse(logCall[1]);
      expect(summary.blockRate).toBe('40.00%');
    });

    it('should sort top blocked IPs and endpoints by count', () => {
      // Block IP1 3 times
      for (let i = 0; i < 3; i++) {
        updateRateLimitStats({
          timestamp: new Date().toISOString(),
          ip: '192.168.1.1',
          endpoint: '/api/comments',
          method: 'GET',
          maxRequests: 10,
          currentCount: 10,
          windowMs: 60000,
          retryAfter: 30,
          status: 'blocked',
        });
      }

      // Block IP2 1 time
      updateRateLimitStats({
        timestamp: new Date().toISOString(),
        ip: '192.168.1.2',
        endpoint: '/api/exercises',
        method: 'GET',
        maxRequests: 10,
        currentCount: 10,
        windowMs: 60000,
        retryAfter: 30,
        status: 'blocked',
      });

      logRateLimitStatsSummary();

      const logCall = (console.log as jest.Mock).mock.calls[0];
      const summary = JSON.parse(logCall[1]);
      
      expect(summary.topBlockedIPs[0].ip).toBe('192.168.1.1');
      expect(summary.topBlockedIPs[0].count).toBe(3);
      expect(summary.topBlockedIPs[1].ip).toBe('192.168.1.2');
      expect(summary.topBlockedIPs[1].count).toBe(1);
    });
  });
});

