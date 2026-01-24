import { MiniAppNotificationDetails } from '@farcaster/miniapp-sdk';
import { Redis } from '@upstash/redis';
import { APP_NAME } from './constants';

// In-memory fallback storage
const localStore = new Map<string, MiniAppNotificationDetails>();

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

// Función para validar y obtener configuración de Redis
function getRedisConfig() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  
  const urlValid = isValidUrl(url);
  const hasToken = !!token && token.trim().length > 0;
  const useRedis = urlValid && hasToken;
  
  return {
    useRedis,
    redis: useRedis && url && token
      ? new Redis({
          url: url,
          token: token,
        })
      : null,
  };
}

const { redis } = getRedisConfig();

function getUserNotificationDetailsKey(fid: number): string {
  return `${APP_NAME}:user:${fid}`;
}

export async function getUserNotificationDetails(
  fid: number
): Promise<MiniAppNotificationDetails | null> {
  const key = getUserNotificationDetailsKey(fid);
  if (redis) {
    return await redis.get<MiniAppNotificationDetails>(key);
  }
  return localStore.get(key) || null;
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: MiniAppNotificationDetails
): Promise<void> {
  const key = getUserNotificationDetailsKey(fid);
  if (redis) {
    await redis.set(key, notificationDetails);
  } else {
    localStore.set(key, notificationDetails);
  }
}

export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  const key = getUserNotificationDetailsKey(fid);
  if (redis) {
    await redis.del(key);
  } else {
    localStore.delete(key);
  }
}
