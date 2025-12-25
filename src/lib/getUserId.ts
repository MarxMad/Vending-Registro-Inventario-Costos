import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

/**
 * Obtiene el userId desde Clerk o desde el header X-User-Id (para usuarios de Farcaster)
 * Si el userId tiene el prefijo "fid-", extrae el FID numérico
 * 
 * @param request - Request de Next.js (opcional, para obtener header personalizado)
 * @returns userId como string, o null si no está autenticado
 */
export async function getUserId(request?: NextRequest): Promise<string | null> {
  // Primero intentar obtener de Clerk
  try {
    const { userId } = await auth();
    if (userId) {
      return userId;
    }
  } catch (_error) {
    // Si Clerk no está disponible, continuar con el header
  }

  // Si no hay userId de Clerk, intentar obtener del header (para usuarios de Farcaster)
  if (request) {
    const userIdFromHeader = request.headers.get('X-User-Id');
    if (userIdFromHeader) {
      return userIdFromHeader;
    }
  }

  return null;
}

/**
 * Extrae el FID de un userId si tiene el formato "fid-{fid}"
 * 
 * @param userId - userId que puede tener formato "fid-{fid}" o ser un ID de Clerk
 * @returns FID numérico si el userId tiene formato "fid-{fid}", null en caso contrario
 */
export function extractFidFromUserId(userId: string | null): number | null {
  if (!userId) return null;
  
  if (userId.startsWith('fid-')) {
    const fid = parseInt(userId.replace('fid-', ''), 10);
    return isNaN(fid) ? null : fid;
  }
  
  return null;
}

