import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '~/lib/getUserId';
import { getMaquinas, getRecolecciones, getCostos } from '~/lib/vendingStorage';
import { APP_NAME } from '~/lib/constants';

/**
 * Endpoint de diagnóstico para verificar el estado del almacenamiento
 * Útil para debuggear problemas de persistencia
 */
export async function GET(request: NextRequest) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  const hasUrl = !!url;
  const hasToken = !!token && token.trim().length > 0;
  
  // Validar URL más robustamente
  let isValidUrl = false;
  if (url) {
    try {
      const parsed = new URL(url);
      isValidUrl = parsed.protocol === 'https:';
    } catch {
      isValidUrl = false;
    }
  }
  
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
      
      // Verificar que las recolecciones tengan máquinas válidas
      const maquinasIds = new Set(maquinas.map(m => m.id));
      const recoleccionesSinMaquina = recolecciones.filter(r => !maquinasIds.has(r.maquinaId));
      
      dataCheck = {
        userId,
        maquinasCount: maquinas.length,
        recoleccionesCount: recolecciones.length,
        costosCount: costos.length,
        recoleccionesSinMaquina: recoleccionesSinMaquina.length,
        sampleKeys: {
          maquinasKey: `${APP_NAME}:maquinas:${userId}`,
          recoleccionesKey: `${APP_NAME}:recolecciones:${userId}`,
          costosKey: `${APP_NAME}:costos:${userId}`,
        },
        sampleMaquinas: maquinas.slice(0, 3).map(m => ({ id: m.id, nombre: m.nombre })),
        sampleRecolecciones: recolecciones.slice(0, 3).map(r => ({ 
          id: r.id, 
          maquinaId: r.maquinaId, 
          fecha: r.fecha,
          ingresos: r.ingresos,
          ingresosNetos: r.ingresosNetos 
        })),
      };
    } catch (error) {
      dataCheck = {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
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
      urlPreview: url ? `${url.substring(0, 40)}...` : null,
      urlLength: url?.length || 0,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 10)}...${token.substring(token.length - 4)}` : null,
      diagnostics: {
        urlExists: hasUrl,
        urlIsValid: isValidUrl,
        tokenExists: hasToken,
        tokenIsNotEmpty: token ? token.trim().length > 0 : false,
        allConditionsMet: isValidUrl && hasToken,
      },
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

