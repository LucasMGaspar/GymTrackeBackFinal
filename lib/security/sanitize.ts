import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitiza conteúdo HTML removendo scripts e tags perigosas
 * Mantém apenas texto puro e quebras de linha
 */
export function sanitizeContent(content: string): string {
  // Remove todas as tags HTML, mantendo apenas texto
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitiza conteúdo mantendo quebras de linha
 */
export function sanitizeWithLineBreaks(content: string): string {
  const sanitized = sanitizeContent(content);
  // Substituir \n por quebras de linha seguras
  return sanitized.replace(/\n/g, '\n');
}

/**
 * Valida formato UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitiza e valida email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Sanitiza string removendo caracteres perigosos
 */
export function sanitizeString(input: string, maxLength?: number): string {
  let sanitized = input.trim();
  
  // Remover caracteres de controle
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Limitar tamanho se especificado
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

