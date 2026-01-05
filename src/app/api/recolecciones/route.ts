import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '~/lib/getUserId';
import { getRecolecciones, saveRecoleccion } from '~/lib/vendingStorage';
import { z } from 'zod';
import type { Recoleccion } from '~/lib/types';

const recoleccionSchema = z.object({
  id: z.string().optional(),
  maquinaId: z.string().min(1),
  fecha: z.string(),
  ingresos: z.number().min(0),
  comisionLocal: z.number().min(0).max(100).optional(),
  ingresosNetos: z.number().min(0),
  productosVendidos: z.array(z.object({
    compartimentoId: z.string(),
    cantidad: z.number().min(0),
    productoId: z.string(),
    productoNombre: z.string(),
    ingresos: z.number().min(0),
  })),
  costos: z.array(z.object({
    concepto: z.string(),
    monto: z.number().min(0),
  })).optional(),
  notas: z.string().optional(),
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
    
    const searchParams = request.nextUrl.searchParams;
    const maquinaId = searchParams.get('maquinaId');
    
    const recolecciones = await getRecolecciones(userId, maquinaId || undefined);
    return NextResponse.json({ recolecciones });
  } catch (error) {
    console.error('Error obteniendo recolecciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener recolecciones' },
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
    
    const data = recoleccionSchema.parse(body);
    const id = data.id || `recoleccion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const recoleccion: Recoleccion = {
      id,
      maquinaId: data.maquinaId,
      fecha: data.fecha,
      ingresos: data.ingresos,
      comisionLocal: data.comisionLocal,
      ingresosNetos: data.ingresosNetos,
      productosVendidos: data.productosVendidos,
      costos: data.costos || [],
      notas: data.notas,
    };
    
    await saveRecoleccion(userId, recoleccion);
    
    return NextResponse.json({ recoleccion });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creando recolección:', error);
    return NextResponse.json(
      { error: 'Error al crear recolección' },
      { status: 500 }
    );
  }
}

