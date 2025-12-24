import { Redis } from '@upstash/redis';
import { APP_NAME } from './constants';
import type { Maquina, Recoleccion, NotificacionRecoleccion, CostoInsumo } from './types';

// In-memory fallback storage
const localStore = new Map<string, any>();

// Use Redis if KV env vars are present, otherwise use in-memory
const useRedis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
const redis = useRedis
  ? new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
  : null;

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
    const data = await redis.get<Maquina[]>(key);
    return data || [];
  }
  return (localStore.get(key) as Maquina[]) || [];
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
  }
}

export async function deleteMaquina(userId: string, maquinaId: string): Promise<void> {
  const key = getMaquinaKey(userId, maquinaId);
  const maquinasKey = getMaquinasKey(userId);
  
  if (redis) {
    await redis.del(key);
    const maquinas = await getMaquinas(userId);
    const filtered = maquinas.filter(m => m.id !== maquinaId);
    await redis.set(maquinasKey, filtered);
  } else {
    localStore.delete(key);
    const maquinas = (localStore.get(maquinasKey) as Maquina[]) || [];
    const filtered = maquinas.filter(m => m.id !== maquinaId);
    localStore.set(maquinasKey, filtered);
  }
}

// ========== RECOLECCIONES ==========

export async function getRecolecciones(userId: string, maquinaId?: string): Promise<Recoleccion[]> {
  const key = getRecoleccionesKey(userId);
  let recolecciones: Recoleccion[] = [];
  
  if (redis) {
    recolecciones = (await redis.get<Recoleccion[]>(key)) || [];
  } else {
    recolecciones = (localStore.get(key) as Recoleccion[]) || [];
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
  
  // Agregar recolección
  recolecciones.push(recoleccion);
  
  if (redis) {
    await redis.set(key, recolecciones);
  } else {
    localStore.set(key, recolecciones);
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

