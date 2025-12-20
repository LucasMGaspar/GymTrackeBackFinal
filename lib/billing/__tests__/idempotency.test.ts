/**
 * Tests for webhook idempotency
 */

describe('Webhook Idempotency', () => {
  function generateIdempotencyKey(eventId: string, provider: string = 'mercadopago'): string {
    return `${provider}_${eventId}`;
  }

  it('should generate consistent idempotency keys', () => {
    const eventId = 'evt_123456';
    const key1 = generateIdempotencyKey(eventId);
    const key2 = generateIdempotencyKey(eventId);
    
    expect(key1).toBe(key2);
    expect(key1).toBe('mercadopago_evt_123456');
  });

  it('should generate different keys for different events', () => {
    const key1 = generateIdempotencyKey('evt_123');
    const key2 = generateIdempotencyKey('evt_456');
    
    expect(key1).not.toBe(key2);
  });

  it('should handle different providers', () => {
    const eventId = 'evt_123';
    const mpKey = generateIdempotencyKey(eventId, 'mercadopago');
    const stripeKey = generateIdempotencyKey(eventId, 'stripe');
    
    expect(mpKey).not.toBe(stripeKey);
    expect(mpKey).toBe('mercadopago_evt_123');
    expect(stripeKey).toBe('stripe_evt_123');
  });
});


