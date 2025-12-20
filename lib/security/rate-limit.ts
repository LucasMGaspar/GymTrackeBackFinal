import { NextRequest, NextResponse } from 'next/server';
import { logRateLimit, updateRateLimitStats, type RateLimitLogEntry } from './rate-limit-logger';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// Map para armazenar contadores (em produção, use Redis)
const rateLimitMap = new Map<string, RateLimitRecord>();

// Limpar registros antigos periodicamente (apenas no servidor)
if (typeof window === 'undefined' && typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000); // Limpar a cada minuto
}

/**
 * Rate limiting middleware
 * @param request - NextRequest
 * @param maxRequests - Número máximo de requisições
 * @param windowMs - Janela de tempo em milissegundos
 * @returns NextResponse com erro 429 ou null se permitido
 */
export function rateLimit(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minuto padrão
): NextResponse | null {
  // Obter IP do cliente
  const ip = 
    request.ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
    request.headers.get('x-real-ip') || 
    'unknown';
  
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  // Se não existe registro ou expirou, criar novo
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { 
      count: 1, 
      resetTime: now + windowMs 
    });
    
    // Log de nova sessão
    const logEntry: RateLimitLogEntry = {
      timestamp: new Date().toISOString(),
      ip,
      endpoint: request.nextUrl?.pathname || 'unknown',
      method: request.method || 'unknown',
      maxRequests,
      currentCount: 1,
      windowMs,
      retryAfter: 0,
      userAgent: request.headers.get('user-agent') || undefined,
      status: 'new_session',
    };
    
    logRateLimit(logEntry);
    updateRateLimitStats(logEntry);
    
    return null; // Permitir requisição
  }
  
  // Log de requisição dentro do limite (apenas em desenvolvimento/debug)
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_RATE_LIMIT === 'true') {
    const logEntry: RateLimitLogEntry = {
      timestamp: new Date().toISOString(),
      ip,
      endpoint: request.nextUrl?.pathname || 'unknown',
      method: request.method || 'unknown',
      maxRequests,
      currentCount: record.count + 1,
      windowMs,
      retryAfter: 0,
      userAgent: request.headers.get('user-agent') || undefined,
      status: 'allowed',
    };
    
    logRateLimit(logEntry);
    updateRateLimitStats(logEntry);
  }
  
  // Se excedeu o limite
  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    
    // Log da tentativa de rate limit bloqueada
    const logEntry: RateLimitLogEntry = {
      timestamp: new Date().toISOString(),
      ip,
      endpoint: request.nextUrl?.pathname || 'unknown',
      method: request.method || 'unknown',
      maxRequests,
      currentCount: record.count,
      windowMs,
      retryAfter,
      userAgent: request.headers.get('user-agent') || undefined,
      status: 'blocked',
    };

    logRateLimit(logEntry);
    updateRateLimitStats(logEntry);

    return NextResponse.json(
      { 
        error: 'Too many requests',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(record.resetTime),
        },
      }
    );
  }
  
  // Incrementar contador
  record.count++;
  
  return null; // Permitir requisição
}

/**
 * Rate limits específicos por endpoint
 */
export const RATE_LIMITS = {
  // APIs de escrita (mais restritivas)
  write: { maxRequests: 20, windowMs: 60000 }, // 20 req/min
  // APIs de leitura (menos restritivas)
  read: { maxRequests: 100, windowMs: 60000 }, // 100 req/min
  // APIs de autenticação (muito restritivas)
  auth: { maxRequests: 5, windowMs: 60000 }, // 5 req/min
  // APIs de WhatsApp (muito restritivas)
  whatsapp: { maxRequests: 10, windowMs: 60000 }, // 10 req/min
};

