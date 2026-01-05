/**
 * Helper para hacer fetch requests con el userId en el header
 * Esto permite que las APIs funcionen tanto con usuarios de Farcaster (FID) como con Clerk
 */

export interface FetchOptions extends RequestInit {
  userId?: string | null;
}

/**
 * Realiza un fetch request agregando el userId en el header X-User-Id si está disponible
 * 
 * @param url - URL del endpoint
 * @param options - Opciones de fetch, incluyendo userId opcional
 * @returns Promise con la respuesta
 */
export async function fetchWithUserId(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { userId, ...fetchOptions } = options;
  
  // Agregar header con userId si está disponible
  const headers = new Headers(fetchOptions.headers);
  if (userId) {
    headers.set('X-User-Id', userId);
  }
  
  return fetch(url, {
    ...fetchOptions,
    headers,
  });
}



