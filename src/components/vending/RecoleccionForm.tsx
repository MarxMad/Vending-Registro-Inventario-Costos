"use client";

import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { fetchWithUserId } from "~/lib/apiClient";
import type { Maquina, Recoleccion } from "~/lib/types";
import { DollarSign, X } from "lucide-react";

interface RecoleccionFormProps {
  userId: string;
  maquina: Maquina;
  onClose: () => void;
  onSave: () => void;
}

export function RecoleccionForm({ userId, maquina, onClose, onSave }: RecoleccionFormProps) {
  const [productosVendidos, setProductosVendidos] = useState<
    Array<{
      compartimentoId: string;
      cantidad: number;
      productoId: string;
      productoNombre: string;
      precio: number;
      ingresos: number;
    }>
  >([]);
  const [rellenos, setRellenos] = useState<Array<{ compartimentoId: string; cantidad: number }>>([]);
  const [fecha, setFecha] = useState(() => {
    // Por defecto usar fecha y hora actual
    const now = new Date();
    // Formato YYYY-MM-DDTHH:mm para input datetime-local
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });
  const [notas, setNotas] = useState("");
  const [comisionLocal, setComisionLocal] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const calcularIngresosTotales = () => {
    return productosVendidos.reduce((sum, p) => sum + p.ingresos, 0);
  };

  const calcularIngresosNetos = () => {
    const ingresosTotales = calcularIngresosTotales();
    const comisionMonto = ingresosTotales * (comisionLocal / 100);
    return ingresosTotales - comisionMonto;
  };

  const handleAgregarProducto = (compartimentoId: string) => {
    const compartimento = maquina.compartimentos.find((c) => c.id === compartimentoId);
    if (!compartimento) return;

    // Obtener nombre del producto: primero de producto, luego de tipoProducto
    const nombreProducto = compartimento.producto?.nombre || 
      (compartimento.tipoProducto ? 
        (compartimento.tipoProducto as string).charAt(0).toUpperCase() + 
        (compartimento.tipoProducto as string).slice(1) 
      : "Producto");
    
    // Obtener precio: primero precioVenta, luego producto.precio, luego 0
    const precio = compartimento.precioVenta || compartimento.producto?.precio || 0;

    // Solo permitir ingresar ingresos totales
    if (precio <= 0) {
      alert("Este producto no tiene precio configurado. Configura el precio primero.");
      return;
    }

    const ingresosInput = prompt(`Ingresos totales de ${nombreProducto} (precio unitario: $${precio}):`);
    if (!ingresosInput) return;

    const ingresos = parseFloat(ingresosInput) || 0;
    if (ingresos <= 0) {
      alert("Los ingresos deben ser mayores a 0");
      return;
    }

    // Calcular cantidad: Ingreso / precio de venta = piezas vendidas
    const cantidadNum = Math.round((ingresos / precio) * 100) / 100; // Redondear a 2 decimales
    
    if (cantidadNum <= 0) {
      alert("Los ingresos deben ser mayores al precio unitario");
      return;
    }

    const productoId = compartimento.producto?.id || compartimento.id;

    setProductosVendidos([
      ...productosVendidos,
      {
        compartimentoId,
        cantidad: cantidadNum,
        productoId,
        productoNombre: nombreProducto,
        precio,
        ingresos,
      },
    ]);
  };

  const handleEliminarProducto = (index: number) => {
    setProductosVendidos(productosVendidos.filter((_, i) => i !== index));
  };

  const handleAgregarRelleno = (compartimentoId: string) => {
    const compartimento = maquina.compartimentos.find((c) => c.id === compartimentoId);
    if (!compartimento) return;

    const nombreProducto = compartimento.producto?.nombre || 
      (compartimento.tipoProducto ? 
        (compartimento.tipoProducto as string).charAt(0).toUpperCase() + 
        (compartimento.tipoProducto as string).slice(1) 
      : "Producto");

    const cantidad = prompt(`Cantidad rellenada de ${nombreProducto} (máximo ${compartimento.capacidad - compartimento.cantidadActual}):`);
    if (!cantidad) return;

    const cantidadNum = parseInt(cantidad) || 0;
    if (cantidadNum <= 0) return;

    const maxRelleno = compartimento.capacidad - compartimento.cantidadActual;
    if (cantidadNum > maxRelleno) {
      alert(`No puedes rellenar más de ${maxRelleno} unidades. Capacidad máxima: ${compartimento.capacidad}`);
      return;
    }

    const existingIndex = rellenos.findIndex(r => r.compartimentoId === compartimentoId);
    if (existingIndex >= 0) {
      const nuevosRellenos = [...rellenos];
      nuevosRellenos[existingIndex] = { compartimentoId, cantidad: cantidadNum };
      setRellenos(nuevosRellenos);
    } else {
      setRellenos([...rellenos, { compartimentoId, cantidad: cantidadNum }]);
    }
  };

  const handleEliminarRelleno = (compartimentoId: string) => {
    setRellenos(rellenos.filter(r => r.compartimentoId !== compartimentoId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convertir fecha del input a ISO string
      const fechaISO = new Date(fecha).toISOString();
      
      const ingresosTotales = calcularIngresosTotales();
      const ingresosNetos = calcularIngresosNetos();
      
      const recoleccion: Omit<Recoleccion, "id"> = {
        maquinaId: maquina.id,
        fecha: fechaISO,
        ingresos: ingresosTotales,
        comisionLocal: comisionLocal > 0 ? comisionLocal : undefined,
        ingresosNetos: ingresosNetos,
        productosVendidos: productosVendidos.map((p) => ({
          compartimentoId: p.compartimentoId,
          cantidad: p.cantidad,
          productoId: p.productoId,
          productoNombre: p.productoNombre,
          ingresos: p.ingresos,
        })),
        costos: [],
        notas: notas || undefined,
      };

      // Primero guardar la recolección
      const response = await fetchWithUserId("/api/recolecciones", {
        method: "POST",
        userId,
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recoleccion),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return;
      }

      // Luego actualizar los rellenos de productos si hay
      if (rellenos.length > 0) {
        try {
          const maquinaActualizada = { ...maquina };
          rellenos.forEach(relleno => {
            const compartimento = maquinaActualizada.compartimentos.find(c => c.id === relleno.compartimentoId);
            if (compartimento) {
              compartimento.cantidadActual = Math.min(
                compartimento.capacidad,
                compartimento.cantidadActual + relleno.cantidad
              );
            }
          });

          const updateResponse = await fetchWithUserId("/api/maquinas", {
            method: "PUT",
            userId,
            headers: { 
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ maquina: maquinaActualizada }),
          });

          if (!updateResponse.ok) {
            console.error("Error actualizando rellenos");
          }
        } catch (error) {
          console.error("Error actualizando rellenos:", error);
        }
      }

      onSave();
    } catch (error) {
      console.error("Error guardando recolección:", error);
      alert("Error al guardar la recolección");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-neutral-900 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Registrar Recolección</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Máquina: <span className="font-semibold">{maquina.nombre}</span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ubicación: {typeof maquina.ubicacion === 'string' ? maquina.ubicacion : maquina.ubicacion.direccion}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fecha de Recolección */}
        <div>
          <label className="block text-sm font-medium mb-2">Fecha y Hora de Recolección *</label>
          <input
            type="datetime-local"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="w-full h-12 rounded-xl border-2 border-yellow-300 bg-white text-black px-4 focus:border-red-500 focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Puedes ajustar la fecha si estás registrando una recolección de un día anterior
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Productos Vendidos</label>
          <div className="space-y-2">
            {maquina.compartimentos.map((comp) => {
              const nombreProducto = comp.producto?.nombre || 
                (comp.tipoProducto ? 
                  (comp.tipoProducto as string).charAt(0).toUpperCase() + 
                  (comp.tipoProducto as string).slice(1) 
                : "Sin producto");
              const precio = comp.precioVenta || comp.producto?.precio || 0;
              const tieneProducto = comp.producto || comp.tipoProducto;

              return (
                <div key={comp.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{nombreProducto}</p>
                    {tieneProducto && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {precio > 0 ? `Precio: $${precio} | ` : ""}Stock: {comp.cantidadActual} / {comp.capacidad}
                      </p>
                    )}
                  </div>
                  {tieneProducto && (
                    <Button
                      type="button"
                      onClick={() => handleAgregarProducto(comp.id)}
                      size="sm"
                      variant="outline"
                    >
                      Venta
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {productosVendidos.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Ventas Registradas:</p>
              {productosVendidos.map((pv, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <div>
                    <p className="font-medium">{pv.productoNombre}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {pv.cantidad} {pv.precio > 0 ? `x $${pv.precio} = $${pv.ingresos}` : "unidades"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEliminarProducto(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Relleno de Productos</label>
          <p className="text-xs text-gray-500 mb-2">Registra cuánto producto rellenaste en cada compartimento</p>
          <div className="space-y-2">
            {maquina.compartimentos.map((comp) => {
              const nombreProducto = comp.producto?.nombre || 
                (comp.tipoProducto ? 
                  (comp.tipoProducto as string).charAt(0).toUpperCase() + 
                  (comp.tipoProducto as string).slice(1) 
                : "Sin producto");
              const tieneProducto = comp.producto || comp.tipoProducto;
              const relleno = rellenos.find(r => r.compartimentoId === comp.id);
              const espacioDisponible = comp.capacidad - comp.cantidadActual;

              if (!tieneProducto) return null;

              return (
                <div key={comp.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{nombreProducto}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Stock actual: {comp.cantidadActual} / {comp.capacidad} 
                      {espacioDisponible > 0 && ` (Espacio: ${espacioDisponible})`}
                    </p>
                    {relleno && (
                      <p className="text-sm text-green-600 font-semibold mt-1">
                        +{relleno.cantidad} unidades
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleAgregarRelleno(comp.id)}
                    size="sm"
                    variant="secondary"
                  >
                    {relleno ? "Cambiar" : "Rellenar"}
                  </Button>
                  {relleno && (
                    <button
                      type="button"
                      onClick={() => handleEliminarRelleno(comp.id)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Comisión del Local */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Comisión del Local (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={comisionLocal}
            onChange={(e) => setComisionLocal(parseFloat(e.target.value) || 0)}
            className="w-full h-12 rounded-xl border-2 border-yellow-300 bg-white text-black px-4 focus:border-red-500 focus:outline-none"
            placeholder="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Porcentaje de comisión que se le da al local (ej: 10 para 10%)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notas</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full rounded-md border border-neutral-200 bg-white text-black px-3 py-2 dark:border-neutral-800 dark:bg-white dark:text-black"
            rows={3}
          />
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Ingresos Totales:</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              ${calcularIngresosTotales().toFixed(2)}
            </span>
          </div>
          {comisionLocal > 0 && (
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Comisión ({comisionLocal}%):
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                -${(calcularIngresosTotales() * (comisionLocal / 100)).toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-bold text-lg">Ingresos Netos:</span>
            <span className="font-bold text-lg text-green-600 dark:text-green-400">
              ${calcularIngresosNetos().toFixed(2)}
            </span>
          </div>
          {rellenos.length > 0 && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Se actualizará el stock de {rellenos.length} compartimento{rellenos.length > 1 ? 's' : ''} después de guardar
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="button" onClick={onClose} variant="outline" className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" isLoading={loading}>
            <DollarSign className="w-4 h-4 mr-1" />
            Guardar Recolección
          </Button>
        </div>
      </form>
    </div>
  );
}

