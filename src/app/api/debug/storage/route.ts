import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '~/lib/getUserId';
import { getMaquinas, getRecolecciones, getCostos } from '~/lib/vendingStorage';
import { APP_NAME } from '~/lib/constants';

/**
 * Endpoint de diagnóstico para verificar el estado del almacenamiento
 * Útil para debuggear problemas de persistencia
 */
export async function GET(request: NextRequest) {
  const hasUrl = !!process.env.KV_REST_API_URL;
  const hasToken = !!process.env.KV_REST_API_TOKEN;
  const isValidUrl = hasUrl && process.env.KV_REST_API_URL?.startsWith('https://');
  
  const isUsingRedis = isValidUrl && hasToken;
  
  // Obtener userId para verificar datos
  const userId = await getUserId(request);
  
  // Verificar datos existentes
  let dataCheck: any = null;
  if (userId) {
    try {
      const maquinas = await getMaquinas(userId);
      const recolecciones = await getRecolecciones(userId);
      const costos = await getCostos(userId);
      
      dataCheck = {
        userId,
        maquinasCount: maquinas.length,
        recoleccionesCount: recolecciones.length,
        costosCount: costos.length,
        sampleKeys: {
          maquinasKey: `${APP_NAME}:maquinas:${userId}`,
          recoleccionesKey: `${APP_NAME}:recolecciones:${userId}`,
          costosKey: `${APP_NAME}:costos:${userId}`,
        },
      };
    } catch (error) {
      dataCheck = {
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }
  
  return NextResponse.json({
    storage: {
      type: isUsingRedis ? 'Upstash Redis' : 'In-Memory (temporal)',
      configured: isUsingRedis,
      warning: !isUsingRedis 
        ? 'Los datos se perderán al recargar. Configura KV_REST_API_URL y KV_REST_API_TOKEN en Vercel.'
        : null,
    },
    environment: {
      hasUrl,
      hasToken,
      isValidUrl,
      nodeEnv: process.env.NODE_ENV,
      urlPreview: hasUrl ? process.env.KV_REST_API_URL?.substring(0, 30) + '...' : null,
    },
    user: {
      authenticated: !!userId,
      userId: userId || null,
      userIdType: userId?.startsWith('fid-') ? 'Farcaster FID' : userId ? 'Clerk' : 'No autenticado',
    },
    data: dataCheck,
    instructions: !isUsingRedis ? {
      step1: 'Ve a https://upstash.com y crea una cuenta gratuita',
      step2: 'Crea una nueva base de datos Redis',
      step3: 'Copia UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN',
      step4: 'Agrega las variables en Vercel: Settings → Environment Variables',
      step5: 'Re-deploy la aplicación',
    } : null,
  });
}

