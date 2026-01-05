import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '~/lib/getUserId';
import { getMaquinas, getRecolecciones, getCostos } from '~/lib/vendingStorage';
import type { Rentabilidad } from '~/lib/types';

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
    const inicio = searchParams.get('inicio');
    const fin = searchParams.get('fin');
    
    const fechaInicio = inicio ? new Date(inicio) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Últimos 30 días por defecto
    const fechaFin = fin ? new Date(fin) : new Date();
    
    const maquinas = maquinaId 
      ? (await getMaquinas(userId)).filter(m => m.id === maquinaId)
      : await getMaquinas(userId);
    
    const rentabilidades: Rentabilidad[] = [];
    
    for (const maquina of maquinas) {
      const recolecciones = await getRecolecciones(userId, maquina.id);
      const recoleccionesFiltradas = recolecciones.filter(r => {
        const fechaRecoleccion = new Date(r.fecha);
        return fechaRecoleccion >= fechaInicio && fechaRecoleccion <= fechaFin;
      });
      
      // Usar ingresosNetos si está disponible, sino usar ingresos
      const ingresosTotales = recoleccionesFiltradas.reduce((sum, r) => sum + (r.ingresosNetos ?? r.ingresos), 0);
      
      // Costos de recolección (transporte, etc.)
      const costosRecoleccion = recoleccionesFiltradas.reduce((sum, r) => {
        const costos = r.costos?.reduce((s, c) => s + c.monto, 0) || 0;
        return sum + costos;
      }, 0);
      
      // Obtener todos los costos de insumos
      const todosLosCostos = await getCostos(userId);
      
      // Calcular costos de productos vendidos basados en costos de insumos relacionados
      const costosProductos = recoleccionesFiltradas.reduce((sum, recoleccion) => {
        return sum + recoleccion.productosVendidos.reduce((sumPv, pv) => {
          // Buscar costos relacionados con este producto
          const costosRelacionados = todosLosCostos.filter(costo => {
            // Verificar si el costo está relacionado con este producto
            if (!costo.productosRelacionados || costo.productosRelacionados.length === 0) {
              // Si no tiene productos relacionados, aplicar si es del mismo tipo de máquina
              return costo.tipoMaquina === maquina.tipo;
            }
            
            // Verificar si alguno de los productos relacionados coincide
            return costo.productosRelacionados.some(prodId => {
              // El formato del ID es: maquinaId-compartimentoId-nombreProducto
              const [maquinaId, compartimentoId] = prodId.split('-');
              return maquinaId === maquina.id && compartimentoId === pv.compartimentoId;
            });
          });
          
          // Calcular el costo proporcional del producto vendido
          // Si hay costos relacionados, usar costoPorUnidad si está disponible, sino calcular promedio
          if (costosRelacionados.length > 0) {
            // Priorizar costoPorUnidad si está disponible
            const costosConUnidad = costosRelacionados.filter(c => c.costoPorUnidad && c.costoPorUnidad > 0);
            
            if (costosConUnidad.length > 0) {
              // Usar costo por unidad individual si está disponible
              const costoPromedioPorUnidad = costosConUnidad.reduce((s, c) => s + (c.costoPorUnidad || 0), 0) / costosConUnidad.length;
              return sumPv + (pv.cantidad * costoPromedioPorUnidad);
            } else {
              // Fallback: calcular basado en costo unitario de compra
              const costoTotalInsumos = costosRelacionados.reduce((s, c) => s + c.costoTotal, 0);
              const cantidadTotalInsumos = costosRelacionados.reduce((s, c) => s + c.cantidad, 0);
              const costoUnitarioPromedio = cantidadTotalInsumos > 0 ? costoTotalInsumos / cantidadTotalInsumos : 0;
              return sumPv + (pv.cantidad * costoUnitarioPromedio);
            }
          }
          
          return sumPv;
        }, 0);
      }, 0);
      
      const costosTotales = costosRecoleccion + costosProductos;
      
      const gananciaNeta = ingresosTotales - costosTotales;
      const margenGanancia = ingresosTotales > 0 
        ? (gananciaNeta / ingresosTotales) * 100 
        : 0;
      
      rentabilidades.push({
        maquinaId: maquina.id,
        periodo: {
          inicio: fechaInicio.toISOString(),
          fin: fechaFin.toISOString(),
        },
        ingresosTotales,
        costosTotales,
        gananciaNeta,
        margenGanancia,
        recolecciones: recoleccionesFiltradas.length,
      });
    }
    
    return NextResponse.json({ rentabilidades });
  } catch (error) {
    console.error('Error calculando rentabilidad:', error);
    return NextResponse.json(
      { error: 'Error al calcular rentabilidad' },
      { status: 500 }
    );
  }
}

