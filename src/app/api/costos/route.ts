import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '~/lib/getUserId';
import { getCostos, saveCosto } from '~/lib/vendingStorage';
import { z } from 'zod';
import type { CostoInsumo, TipoMaquina } from '~/lib/types';

const costoSchema = z.object({
  id: z.string().optional(),
  fecha: z.string(),
  tipoMaquina: z.enum(['peluchera', 'chiclera']),
  concepto: z.string().min(1),
  cantidad: z.number().min(0),
  unidad: z.string().min(1),
  costoUnitario: z.number().min(0),
  costoTotal: z.number().min(0),
  unidadesPorKg: z.number().optional(),
  kgPorCaja: z.number().optional(),
  unidadesPorBolsas: z.number().optional(),
  costoPorUnidad: z.number().optional(),
  proveedor: z.string().optional(),
  notas: z.string().optional(),
  productosRelacionados: z.array(z.string()).optional(),
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
    const tipo = searchParams.get('tipo') as TipoMaquina | null;
    
    let costos = await getCostos(userId);
    
    if (tipo) {
      costos = costos.filter(c => c.tipoMaquina === tipo);
    }
    
    return NextResponse.json({ costos });
  } catch (error) {
    console.error('Error obteniendo costos:', error);
    return NextResponse.json(
      { error: 'Error al obtener costos' },
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
    
    const data = costoSchema.parse(body);
    const id = data.id || `costo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const costo: CostoInsumo = {
      id,
      fecha: data.fecha,
      tipoMaquina: data.tipoMaquina,
      concepto: data.concepto,
      cantidad: data.cantidad,
      unidad: data.unidad,
      costoUnitario: data.costoUnitario,
      costoTotal: data.costoTotal,
      unidadesPorKg: data.unidadesPorKg,
      kgPorCaja: data.kgPorCaja,
      unidadesPorBolsas: data.unidadesPorBolsas,
      costoPorUnidad: data.costoPorUnidad,
      proveedor: data.proveedor,
      notas: data.notas,
      productosRelacionados: data.productosRelacionados,
    };
    
    await saveCosto(userId, costo);
    
    return NextResponse.json({ costo });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creando costo:', error);
    return NextResponse.json(
      { error: 'Error al crear costo' },
      { status: 500 }
    );
  }
}

