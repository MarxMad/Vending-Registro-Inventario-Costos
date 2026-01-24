import { NextRequest, NextResponse } from 'next/server';
import { getMaquinas, saveMaquina, deleteMaquina } from '~/lib/vendingStorage';
import { getUserId } from '~/lib/getUserId';
import { z } from 'zod';
import type { Maquina, Compartimento, ProductoChiclera, ProductoPeluchera } from '~/lib/types';

// Schema de validación para crear/actualizar máquina
const maquinaSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1),
  color: z.string().min(1),
  tipo: z.enum(['peluchera', 'chiclera']),
  tipoChiclera: z.enum(['individual', 'doble', 'triple']).optional(),
  tipoProductoChiclera: z.enum(['granel', 'bola']).optional(),
  lugarId: z.string().min(1), // ID del lugar donde está la máquina
  compartimentos: z.array(z.object({
    id: z.string(),
    producto: z.object({
      id: z.string(),
      nombre: z.string(),
      precio: z.number().min(0),
      costo: z.number().min(0),
    }).nullable().optional(),
    capacidad: z.number().min(1),
    cantidadActual: z.number().min(0),
    tipoProducto: z.string().optional(),
    tipoGranelBola: z.enum(['granel', 'bola']).optional(),
    precioVenta: z.number().min(0).optional(),
  })),
  costoMaquina: z.number().min(0),
  fechaInstalacion: z.string(),
  fechaUltimaRecoleccion: z.string().nullable().optional(),
  diasRecoleccionEstimados: z.number().min(1).default(7),
  activa: z.boolean().default(true),
  notas: z.string().optional(),
  imagen: z.string().optional(),
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
    
    const maquinas = await getMaquinas(userId);
    return NextResponse.json({ maquinas });
  } catch (error) {
    console.error('Error obteniendo máquinas:', error);
    return NextResponse.json(
      { error: 'Error al obtener máquinas' },
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
    const data = maquinaSchema.parse(body);
    
    // Generar ID si no existe
    const id = data.id || `maquina-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear compartimentos según el tipo - asegurar que producto sea null en lugar de undefined
    let compartimentos: Compartimento[] = data.compartimentos.map(comp => ({
      id: comp.id,
      producto: comp.producto ?? null,
      capacidad: comp.capacidad,
      cantidadActual: comp.cantidadActual,
      tipoProducto: comp.tipoProducto as ProductoChiclera | ProductoPeluchera | undefined,
      tipoGranelBola: comp.tipoGranelBola,
      precioVenta: comp.precioVenta,
    }));
    
    if (compartimentos.length === 0) {
      if (data.tipo === 'peluchera') {
        compartimentos = [{
          id: `comp-${id}-1`,
          producto: null,
          capacidad: 50,
          cantidadActual: 0,
        }];
      } else if (data.tipo === 'chiclera') {
        const cantidadCompartimentos = 
          data.tipoChiclera === 'doble' ? 2 :
          data.tipoChiclera === 'triple' ? 3 : 1;
        
        compartimentos = Array.from({ length: cantidadCompartimentos }, (_, i) => ({
          id: `comp-${id}-${i + 1}`,
          producto: null,
          capacidad: 200,
          cantidadActual: 0,
        }));
      }
    }
    
    const maquina: Maquina = {
      id,
      nombre: data.nombre,
      color: data.color || 'Sin color',
      tipo: data.tipo,
      tipoChiclera: data.tipo === 'chiclera' ? (data.tipoChiclera || 'individual') : undefined,
      tipoProductoChiclera: data.tipo === 'chiclera' ? (data.tipoProductoChiclera || 'granel') : undefined,
      lugarId: data.lugarId,
      compartimentos,
      costoMaquina: data.costoMaquina,
      fechaInstalacion: data.fechaInstalacion,
      fechaUltimaRecoleccion: data.fechaUltimaRecoleccion || null,
      diasRecoleccionEstimados: data.diasRecoleccionEstimados || 7,
      activa: data.activa ?? true,
      notas: data.notas,
      imagen: data.imagen || undefined,
    };
    
    await saveMaquina(userId, maquina);
    
    return NextResponse.json({ maquina });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creando máquina:', error);
    return NextResponse.json(
      { error: 'Error al crear máquina' },
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
    const { maquina } = body;
    
    if (!maquina || !maquina.id) {
      return NextResponse.json(
        { error: 'Máquina es requerida' },
        { status: 400 }
      );
    }
    
    const data = maquinaSchema.parse(maquina);
    const maquinaActualizada: Maquina = {
      ...data,
      id: maquina.id,
      imagen: data.imagen || undefined, // Asegurar que la imagen se preserve
    } as Maquina;
    
    console.log(`💾 Guardando máquina ${maquinaActualizada.id} con imagen: ${maquinaActualizada.imagen ? `Sí (${maquinaActualizada.imagen.length} chars)` : 'No'}`);
    await saveMaquina(userId, maquinaActualizada);
    
    return NextResponse.json({ maquina: maquinaActualizada });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error actualizando máquina:', error);
    return NextResponse.json(
      { error: 'Error al actualizar máquina' },
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
    const maquinaId = searchParams.get('maquinaId');
    
    if (!maquinaId) {
      return NextResponse.json(
        { error: 'maquinaId es requerido' },
        { status: 400 }
      );
    }
    
    await deleteMaquina(userId, maquinaId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando máquina:', error);
    return NextResponse.json(
      { error: 'Error al eliminar máquina' },
      { status: 500 }
    );
  }
}

