import { Redis } from '@upstash/redis';
import { createHash, randomBytes } from 'crypto';

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

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  passwordHash: string;
  fechaCreacion: string;
}

function getUsuarioKey(email: string): string {
  return `vending:usuario:${email}`;
}

function getUsuarioByIdKey(userId: string): string {
  return `vending:usuario:id:${userId}`;
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function getUsuario(email: string): Promise<Usuario | null> {
  const key = getUsuarioKey(email);
  if (redis) {
    return await redis.get<Usuario>(key);
  }
  return (localStore.get(key) as Usuario) || null;
}

export async function getUsuarioById(userId: string): Promise<Usuario | null> {
  const key = getUsuarioByIdKey(userId);
  if (redis) {
    return await redis.get<Usuario>(key);
  }
  return (localStore.get(key) as Usuario) || null;
}

export async function crearUsuario(data: {
  email: string;
  password: string;
  nombre: string;
}): Promise<Usuario> {
  const userId = `user-${Date.now()}-${randomBytes(8).toString('hex')}`;
  const usuario: Usuario = {
    id: userId,
    email: data.email,
    nombre: data.nombre,
    passwordHash: hashPassword(data.password),
    fechaCreacion: new Date().toISOString(),
  };

  const emailKey = getUsuarioKey(data.email);
  const idKey = getUsuarioByIdKey(userId);

  if (redis) {
    await redis.set(emailKey, usuario);
    await redis.set(idKey, usuario);
  } else {
    localStore.set(emailKey, usuario);
    localStore.set(idKey, usuario);
  }

  return usuario;
}

export async function verificarPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  const hash = hashPassword(password);
  return hash === passwordHash;
}

