import { NextRequest } from 'next/server';
import { verifyToken } from './authUtils';

/**
 * Obtiene el userId del token de autenticación en la request
 * @param request - La request de Next.js
 * @returns El userId si el token es válido, null en caso contrario
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Intentar obtener el token del header Authorization (método preferido)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      return payload?.userId || null;
    }

    // Si no hay header, intentar obtener del body (para compatibilidad)
    // Nota: esto puede consumir el body, así que solo lo hacemos si no hay header
    // y solo si el método es POST/PUT/PATCH
    if (!authHeader && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        // Clonar la request para no consumir el body original
        const clonedRequest = request.clone();
        const body = await clonedRequest.json();
        if (body.token) {
          const payload = verifyToken(body.token);
          return payload?.userId || null;
        }
        // Si hay userId directamente en el body, usarlo (para compatibilidad temporal)
        if (body.userId) {
          return body.userId;
        }
      } catch {
        // Si no se puede parsear el body, continuar
      }
    }

    return null;
  } catch (error) {
    console.error('Error obteniendo userId:', error);
    return null;
  }
}

/**
 * Obtiene el userId de los query params (para compatibilidad con requests GET)
 * @param request - La request de Next.js
 * @returns El userId si está presente, null en caso contrario
 */
export function getUserIdFromQuery(request: NextRequest): string | null {
  const searchParams = request.nextUrl.searchParams;
  return searchParams.get('userId');
}

