// Tipos para el sistema de gestión de máquinas vending

export type TipoMaquina = 'peluchera' | 'chiclera';

export type TipoChiclera = 'individual' | 'doble' | 'triple';

export type TipoProductoChiclera = 'granel' | 'bola';

export type ProductoPeluchera = 'peluches';

export type ProductoChiclera = 'chicles' | 'rocabola' | 'pelotas' | 'capsulas' | 'pokebolas';

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  costo: number; // Costo de compra del producto
  tipoProducto?: TipoProductoChiclera; // Para chicleras
}

export interface Compartimento {
  id: string;
  producto: Producto | null;
  capacidad: number; // Cantidad máxima
  cantidadActual: number;
  tipoProducto?: ProductoChiclera | ProductoPeluchera; // Tipo específico del producto
  tipoGranelBola?: TipoProductoChiclera; // Granel o Bola para chicleras
  precioVenta?: number; // Precio de venta del producto en este compartimento
}

export interface Ubicacion {
  direccion: string;
  coordenadas?: {
    lat: number;
    lng: number;
  };
  googleMapsUrl?: string;
}

export interface Maquina {
  id: string;
  nombre: string;
  color: string;
  tipo: TipoMaquina;
  tipoChiclera?: TipoChiclera; // Solo para chicleras
  tipoProductoChiclera?: TipoProductoChiclera; // Granel o bola
  ubicacion: Ubicacion;
  compartimentos: Compartimento[];
  costoMaquina: number; // Costo de la máquina
  fechaInstalacion: string; // ISO date string
  fechaUltimaRecoleccion: string | null; // ISO date string
  diasRecoleccionEstimados: number; // Días estimados entre recolecciones
  activa: boolean;
  notas?: string;
  imagen?: string; // URL base64 de la imagen de la máquina
}

export interface Recoleccion {
  id: string;
  maquinaId: string;
  fecha: string; // ISO date string
  ingresos: number; // Total de ingresos en esta recolección (antes de comisión)
  comisionLocal?: number; // Porcentaje de comisión del local (0-100)
  ingresosNetos: number; // Ingresos después de descontar comisión
  productosVendidos: {
    compartimentoId: string;
    cantidad: number;
    productoId: string;
    productoNombre: string;
    ingresos: number;
  }[];
  costos: {
    concepto: string;
    monto: number;
  }[];
  notas?: string;
}

export interface Rentabilidad {
  maquinaId: string;
  periodo: {
    inicio: string;
    fin: string;
  };
  ingresosTotales: number;
  costosTotales: number;
  gananciaNeta: number;
  margenGanancia: number; // Porcentaje
  recolecciones: number;
}

export interface NotificacionRecoleccion {
  maquinaId: string;
  maquinaNombre: string;
  ubicacion: string;
  diasDesdeUltimaRecoleccion: number;
  diasEstimados: number;
  prioridad: 'alta' | 'media' | 'baja';
}

export interface CostoInsumo {
  id: string;
  fecha: string; // ISO date string
  tipoMaquina: TipoMaquina; // 'peluchera' | 'chiclera'
  concepto: string; // Descripción del insumo
  cantidad: number;
  unidad: string; // 'kg', 'unidades', 'cajas', 'bolsas', 'paquetes'
  costoUnitario: number; // Costo por unidad de compra (kg, caja, bolsa, etc.)
  costoTotal: number;
  // Campos para calcular costo por unidad individual
  unidadesPorKg?: number; // Si unidad es "kg": cuántas unidades hay en 1 kg
  kgPorCaja?: number; // Si unidad es "cajas": cuántos kg hay en 1 caja
  unidadesPorBolsas?: number; // Si unidad es "bolsas": cuántas unidades hay en 1 bolsa
  costoPorUnidad?: number; // Costo calculado por unidad individual
  proveedor?: string;
  notas?: string;
  productosRelacionados?: string[]; // IDs de productos relacionados
}

export interface CostoMaquina {
  id: string;
  maquinaId: string;
  fecha: string;
  concepto: string;
  monto: number;
  tipo: 'instalacion' | 'mantenimiento' | 'reparacion' | 'otro';
  notas?: string;
}

