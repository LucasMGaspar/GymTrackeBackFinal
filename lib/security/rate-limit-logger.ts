/**
 * Logger para eventos de rate limiting
 * Centraliza o logging de tentativas de rate limit para facilitar monitoramento
 */

export interface RateLimitLogEntry {
  timestamp: string;
  ip: string;
  endpoint: string;
  method: string;
  maxRequests: number;
  currentCount: number;
  windowMs: number;
  retryAfter: number;
  userAgent?: string;
  status: 'allowed' | 'blocked' | 'new_session';
}

/**
 * Log de rate limit
 */
export function logRateLimit(entry: RateLimitLogEntry): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDebugMode = process.env.DEBUG_RATE_LIMIT === 'true';

  // Em produção, sempre logar bloqueios
  if (entry.status === 'blocked') {
    console.error('[RATE_LIMIT_EXCEEDED]', JSON.stringify(entry));
    
    // Em produção, também pode enviar para serviço de monitoramento
    // Exemplo: sendToMonitoringService(entry);
  }

  // Em desenvolvimento ou modo debug, logar tudo
  if (!isProduction || isDebugMode) {
    const emoji = entry.status === 'blocked' ? '🚫' : entry.status === 'new_session' ? '🆕' : '✅';
    const statusText = entry.status === 'blocked' 
      ? 'BLOCKED' 
      : entry.status === 'new_session' 
      ? 'NEW SESSION' 
      : 'ALLOWED';

    console.log(`${emoji} [RATE_LIMIT] ${statusText}:`, {
      IP: entry.ip,
      Endpoint: entry.endpoint,
      Method: entry.method,
      Count: entry.status === 'blocked' 
        ? `${entry.currentCount}/${entry.maxRequests}` 
        : entry.status === 'new_session'
        ? '1'
        : `${entry.currentCount}/${entry.maxRequests}`,
      Remaining: entry.status === 'blocked' 
        ? 0 
        : entry.maxRequests - entry.currentCount,
      RetryAfter: entry.status === 'blocked' ? `${entry.retryAfter}s` : undefined,
      Timestamp: entry.timestamp,
    });
  }
}

/**
 * Estatísticas de rate limit (para monitoramento)
 */
interface RateLimitStats {
  totalRequests: number;
  blockedRequests: number;
  allowedRequests: number;
  uniqueIPs: Set<string>;
  topBlockedIPs: Map<string, number>;
  topBlockedEndpoints: Map<string, number>;
}

const stats: RateLimitStats = {
  totalRequests: 0,
  blockedRequests: 0,
  allowedRequests: 0,
  uniqueIPs: new Set(),
  topBlockedIPs: new Map(),
  topBlockedEndpoints: new Map(),
};

/**
 * Atualizar estatísticas
 */
export function updateRateLimitStats(entry: RateLimitLogEntry): void {
  stats.totalRequests++;
  stats.uniqueIPs.add(entry.ip);

  if (entry.status === 'blocked') {
    stats.blockedRequests++;
    
    // Contar IPs bloqueados
    const ipCount = stats.topBlockedIPs.get(entry.ip) || 0;
    stats.topBlockedIPs.set(entry.ip, ipCount + 1);
    
    // Contar endpoints bloqueados
    const endpointCount = stats.topBlockedEndpoints.get(entry.endpoint) || 0;
    stats.topBlockedEndpoints.set(entry.endpoint, endpointCount + 1);
  } else {
    stats.allowedRequests++;
  }
}

/**
 * Obter estatísticas atuais
 */
export function getRateLimitStats(): RateLimitStats {
  return {
    ...stats,
    uniqueIPs: new Set(stats.uniqueIPs), // Clone para evitar mutação externa
    topBlockedIPs: new Map(stats.topBlockedIPs),
    topBlockedEndpoints: new Map(stats.topBlockedEndpoints),
  };
}

/**
 * Resetar estatísticas (útil para testes)
 */
export function resetRateLimitStats(): void {
  stats.totalRequests = 0;
  stats.blockedRequests = 0;
  stats.allowedRequests = 0;
  stats.uniqueIPs.clear();
  stats.topBlockedIPs.clear();
  stats.topBlockedEndpoints.clear();
}

/**
 * Log resumido de estatísticas (para logs periódicos)
 */
export function logRateLimitStatsSummary(): void {
  const summary = getRateLimitStats();
  
  console.log('[RATE_LIMIT_STATS]', JSON.stringify({
    timestamp: new Date().toISOString(),
    totalRequests: summary.totalRequests,
    blockedRequests: summary.blockedRequests,
    allowedRequests: summary.allowedRequests,
    blockRate: summary.totalRequests > 0 
      ? ((summary.blockedRequests / summary.totalRequests) * 100).toFixed(2) + '%'
      : '0%',
    uniqueIPs: summary.uniqueIPs.size,
    topBlockedIPs: Array.from(summary.topBlockedIPs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count })),
    topBlockedEndpoints: Array.from(summary.topBlockedEndpoints.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([endpoint, count]) => ({ endpoint, count })),
  }));
}


