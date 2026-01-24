import { NextRequest, NextResponse } from 'next/server';
import { getLugares, saveLugar, deleteLugar } from '~/lib/vendingStorage';
import { getUserId } from '~/lib/getUserId';
import { z } from 'zod';
import type { Lugar } from '~/lib/types';

// Schema de validación para crear/actualizar lugar
const lugarSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1),
  direccion: z.string().min(1),
  coordenadas: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  googleMapsUrl: z.string().optional(),
  notas: z.string().optional(),
  fechaCreacion: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }
    
    const lugares = await getLugares(userId);
    return NextResponse.json({ lugares });
  } catch (error) {
    console.error('Error obteniendo lugares:', error);
    return NextResponse.json(
      { error: 'Error al obtener lugares' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validar datos
    const data = lugarSchema.parse(body);
    
    // Generar ID si no existe
    const id = data.id || `lugar-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    
    const lugar: Lugar = {
      id,
      nombre: data.nombre,
      direccion: data.direccion,
      coordenadas: data.coordenadas,
      googleMapsUrl: data.googleMapsUrl,
      notas: data.notas,
      fechaCreacion: data.fechaCreacion || new Date().toISOString(),
    };
    
    await saveLugar(userId, lugar);
    
    return NextResponse.json({ lugar });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creando lugar:', error);
    return NextResponse.json(
      { error: 'Error al crear lugar' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { lugar } = body;
    
    if (!lugar || !lugar.id) {
      return NextResponse.json(
        { error: 'Lugar es requerido' },
        { status: 400 }
      );
    }
    
    const data = lugarSchema.parse(lugar);
    const lugarActualizado: Lugar = {
      ...data,
      id: lugar.id,
    } as Lugar;
    
    await saveLugar(userId, lugarActualizado);
    
    return NextResponse.json({ lugar: lugarActualizado });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error actualizando lugar:', error);
    return NextResponse.json(
      { error: 'Error al actualizar lugar' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const lugarId = searchParams.get('lugarId');
    
    if (!lugarId) {
      return NextResponse.json(
        { error: 'lugarId es requerido' },
        { status: 400 }
      );
    }
    
    await deleteLugar(userId, lugarId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando lugar:', error);
    return NextResponse.json(
      { error: 'Error al eliminar lugar' },
      { status: 500 }
    );
  }
}
