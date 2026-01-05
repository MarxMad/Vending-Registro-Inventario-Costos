import { Redis } from '@upstash/redis';
import { APP_NAME } from './constants';
import type { Maquina, Recoleccion, NotificacionRecoleccion, CostoInsumo } from './types';

// In-memory fallback storage
const localStore = new Map<string, any>();

// Use Redis if KV env vars are present and valid, otherwise use in-memory
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const useRedis = isValidUrl(process.env.KV_REST_API_URL) && process.env.KV_REST_API_TOKEN;
const redis = useRedis
  ? new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
  : null;

// Logging para diagnóstico (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  if (useRedis) {
    console.log('✅ Usando Upstash Redis para almacenamiento persistente');
  } else {
    console.warn('⚠️  Upstash Redis NO configurado - usando almacenamiento en memoria (los datos se perderán al recargar)');
    console.warn('   Configura KV_REST_API_URL y KV_REST_API_TOKEN para persistencia');
  }
}

// Keys para almacenamiento
function getMaquinasKey(userId: string): string {
  return `${APP_NAME}:maquinas:${userId}`;
}

function getRecoleccionesKey(userId: string): string {
  return `${APP_NAME}:recolecciones:${userId}`;
}

function getCostosKey(userId: string): string {
  return `${APP_NAME}:costos:${userId}`;
}

function getMaquinaKey(userId: string, maquinaId: string): string {
  return `${APP_NAME}:maquina:${userId}:${maquinaId}`;
}

// ========== MÁQUINAS ==========

export async function getMaquinas(userId: string): Promise<Maquina[]> {
  const key = getMaquinasKey(userId);
  if (redis) {
    try {
      const data = await redis.get<Maquina[]>(key);
      const maquinas = data || [];
      console.log(`📖 Máquinas leídas de Redis: ${maquinas.length} máquina(s)`);
      return maquinas;
    } catch (error) {
      console.error('❌ Error leyendo máquinas de Redis:', error);
      throw error;
    }
  }
  const maquinas = (localStore.get(key) as Maquina[]) || [];
  console.warn(`⚠️  Máquinas leídas de memoria: ${maquinas.length} máquina(s)`);
  return maquinas;
}

export async function getMaquina(userId: string, maquinaId: string): Promise<Maquina | null> {
  const key = getMaquinaKey(userId, maquinaId);
  if (redis) {
    return await redis.get<Maquina>(key);
  }
  return (localStore.get(key) as Maquina) || null;
}

export async function saveMaquina(userId: string, maquina: Maquina): Promise<void> {
  const key = getMaquinaKey(userId, maquina.id);
  const maquinasKey = getMaquinasKey(userId);
  
  // Guardar máquina individual
  if (redis) {
    try {
      await redis.set(key, maquina);
      // Actualizar lista de máquinas
      const maquinas = await getMaquinas(userId);
      const index = maquinas.findIndex(m => m.id === maquina.id);
      if (index >= 0) {
        maquinas[index] = maquina;
      } else {
        maquinas.push(maquina);
      }
      await redis.set(maquinasKey, maquinas);
      console.log(`✅ Máquina guardada en Redis: ${key} (total máquinas: ${maquinas.length})`);
      
      // Verificar que se guardó correctamente
      const verificacion = await redis.get<Maquina[]>(maquinasKey);
      if (!verificacion || verificacion.length !== maquinas.length) {
        console.error('⚠️  Advertencia: Los datos guardados no coinciden con lo esperado');
      }
    } catch (error) {
      console.error('❌ Error guardando en Redis:', error);
      throw error;
    }
  } else {
    localStore.set(key, maquina);
    const maquinas = (localStore.get(maquinasKey) as Maquina[]) || [];
    const index = maquinas.findIndex(m => m.id === maquina.id);
    if (index >= 0) {
      maquinas[index] = maquina;
    } else {
      maquinas.push(maquina);
    }
    localStore.set(maquinasKey, maquinas);
    console.warn(`⚠️  Máquina guardada en memoria (se perderá al recargar): ${key}`);
  }
}

export async function deleteMaquina(userId: string, maquinaId: string): Promise<void> {
  const key = getMaquinaKey(userId, maquinaId);
  const maquinasKey = getMaquinasKey(userId);
  
  // Eliminar máquina
  if (redis) {
    try {
      await redis.del(key);
      const maquinas = await getMaquinas(userId);
      const filtered = maquinas.filter(m => m.id !== maquinaId);
      await redis.set(maquinasKey, filtered);
      console.log(`✅ Máquina eliminada de Redis: ${key}`);
    } catch (error) {
      console.error('❌ Error eliminando máquina de Redis:', error);
      throw error;
    }
  } else {
    localStore.delete(key);
    const maquinas = (localStore.get(maquinasKey) as Maquina[]) || [];
    const filtered = maquinas.filter(m => m.id !== maquinaId);
    localStore.set(maquinasKey, filtered);
    console.warn(`⚠️  Máquina eliminada de memoria: ${key}`);
  }
  
  // Eliminar todas las recolecciones asociadas a esta máquina
  await deleteRecoleccionesPorMaquina(userId, maquinaId);
}

// ========== RECOLECCIONES ==========

export async function getRecolecciones(userId: string, maquinaId?: string): Promise<Recoleccion[]> {
  const key = getRecoleccionesKey(userId);
  let recolecciones: Recoleccion[] = [];
  
  if (redis) {
    try {
      recolecciones = (await redis.get<Recoleccion[]>(key)) || [];
      console.log(`📖 Recolecciones leídas de Redis: ${recolecciones.length} recolección(es)`);
    } catch (error) {
      console.error('❌ Error leyendo recolecciones de Redis:', error);
      throw error;
    }
  } else {
    recolecciones = (localStore.get(key) as Recoleccion[]) || [];
    console.warn(`⚠️  Recolecciones leídas de memoria: ${recolecciones.length} recolección(es)`);
  }
  
  if (maquinaId) {
    return recolecciones.filter(r => r.maquinaId === maquinaId);
  }
  
  return recolecciones;
}

export async function saveRecoleccion(userId: string, recoleccion: Recoleccion): Promise<void> {
  const key = getRecoleccionesKey(userId);
  const recolecciones = await getRecolecciones(userId);
  
  // Actualizar fecha de última recolección en la máquina
  const maquina = await getMaquina(userId, recoleccion.maquinaId);
  if (maquina) {
    maquina.fechaUltimaRecoleccion = recoleccion.fecha;
    await saveMaquina(userId, maquina);
  }
  
  // Si la recolección ya existe (mismo ID), actualizarla; si no, agregarla
  const index = recolecciones.findIndex(r => r.id === recoleccion.id);
  if (index >= 0) {
    recolecciones[index] = recoleccion;
  } else {
    recolecciones.push(recoleccion);
  }
  
  if (redis) {
    try {
      await redis.set(key, recolecciones);
      console.log(`✅ Recolección guardada en Redis: ${key} (total: ${recolecciones.length})`);
      
      // Verificar que se guardó correctamente
      const verificacion = await redis.get<Recoleccion[]>(key);
      if (!verificacion || verificacion.length !== recolecciones.length) {
        console.error('⚠️  Advertencia: Los datos guardados no coinciden con lo esperado');
      }
    } catch (error) {
      console.error('❌ Error guardando recolección en Redis:', error);
      throw error;
    }
  } else {
    localStore.set(key, recolecciones);
    console.warn(`⚠️  Recolección guardada en memoria (se perderá al recargar): ${key}`);
  }
}

export async function deleteRecoleccionesPorMaquina(userId: string, maquinaId: string): Promise<void> {
  const key = getRecoleccionesKey(userId);
  const recolecciones = await getRecolecciones(userId);
  const recoleccionesFiltradas = recolecciones.filter(r => r.maquinaId !== maquinaId);
  
  if (recolecciones.length === recoleccionesFiltradas.length) {
    // No había recolecciones para eliminar
    return;
  }
  
  const eliminadas = recolecciones.length - recoleccionesFiltradas.length;
  
  if (redis) {
    try {
      await redis.set(key, recoleccionesFiltradas);
      console.log(`✅ ${eliminadas} recolección(es) eliminada(s) de Redis para máquina ${maquinaId}`);
    } catch (error) {
      console.error('❌ Error eliminando recolecciones de Redis:', error);
      throw error;
    }
  } else {
    localStore.set(key, recoleccionesFiltradas);
    console.warn(`⚠️  ${eliminadas} recolección(es) eliminada(s) de memoria para máquina ${maquinaId}`);
  }
}

// ========== NOTIFICACIONES ==========

export async function getMaquinasParaRecoleccion(userId: string): Promise<NotificacionRecoleccion[]> {
  const maquinas = await getMaquinas(userId);
  const notificaciones: NotificacionRecoleccion[] = [];
  const ahora = new Date();
  
  for (const maquina of maquinas) {
    if (!maquina.activa || !maquina.fechaUltimaRecoleccion) continue;
    
    const ultimaRecoleccion = new Date(maquina.fechaUltimaRecoleccion);
    const diasTranscurridos = Math.floor(
      (ahora.getTime() - ultimaRecoleccion.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const diasEstimados = maquina.diasRecoleccionEstimados || 7;
    const porcentaje = (diasTranscurridos / diasEstimados) * 100;
    
    let prioridad: 'alta' | 'media' | 'baja' = 'baja';
    if (porcentaje >= 100) prioridad = 'alta';
    else if (porcentaje >= 75) prioridad = 'media';
    
    if (porcentaje >= 50) { // Solo notificar si está al 50% o más
      notificaciones.push({
        maquinaId: maquina.id,
        maquinaNombre: maquina.nombre,
        ubicacion: typeof maquina.ubicacion === 'string' 
          ? maquina.ubicacion 
          : maquina.ubicacion.direccion,
        diasDesdeUltimaRecoleccion: diasTranscurridos,
        diasEstimados: diasEstimados,
        prioridad,
      });
    }
  }
  
  // Ordenar por prioridad y días transcurridos
  return notificaciones.sort((a, b) => {
    const prioridadOrder = { alta: 3, media: 2, baja: 1 };
    if (prioridadOrder[a.prioridad] !== prioridadOrder[b.prioridad]) {
      return prioridadOrder[b.prioridad] - prioridadOrder[a.prioridad];
    }
    return b.diasDesdeUltimaRecoleccion - a.diasDesdeUltimaRecoleccion;
  });
}

// ========== COSTOS ==========

export async function getCostos(userId: string): Promise<CostoInsumo[]> {
  const key = getCostosKey(userId);
  if (redis) {
    const data = await redis.get<CostoInsumo[]>(key);
    return data || [];
  }
  return (localStore.get(key) as CostoInsumo[]) || [];
}

export async function saveCosto(userId: string, costo: CostoInsumo): Promise<void> {
  const key = getCostosKey(userId);
  const costos = await getCostos(userId);
  
  costos.push(costo);
  
  if (redis) {
    await redis.set(key, costos);
  } else {
    localStore.set(key, costos);
  }
}

