// Mock para isomorphic-dompurify nos testes
export default {
  sanitize: (dirty: string, config?: any) => {
    // Simulação simples: remove tags HTML e seu conteúdo
    if (!config || config.ALLOWED_TAGS?.length === 0) {
      // Remove tags script e seu conteúdo
      let cleaned = dirty.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      // Remove outras tags HTML
      cleaned = cleaned.replace(/<[^>]*>/g, '');
      return cleaned;
    }
    return dirty;
  },
};

