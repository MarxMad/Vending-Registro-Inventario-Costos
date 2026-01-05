"use client";

import { fetchWithUserId } from "~/lib/apiClient";
import { Input } from "~/components/ui/input";
import type { Maquina } from "~/lib/types";
import { Package, X } from "lucide-react";

interface MaquinaDetalleProps {
  userId: string;
  maquina: Maquina;
  onClose: () => void;
  onUpdate: () => void;
}

export function MaquinaDetalle({ userId, maquina, onClose, onUpdate }: MaquinaDetalleProps) {

  const handleActualizarStock = async (compartimentoId: string, cantidad: number) => {
    try {
      const compartimentos = maquina.compartimentos.map((comp) => {
        if (comp.id === compartimentoId) {
          return {
            ...comp,
            cantidadActual: Math.max(0, Math.min(comp.capacidad, cantidad)),
          };
        }
        return comp;
      });

      const maquinaActualizada: Maquina = {
        ...maquina,
        compartimentos,
      };

      const response = await fetchWithUserId("/api/maquinas", {
        method: "PUT",
        userId,
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ maquina: maquinaActualizada }),
      });

      if (response.ok) {
        onUpdate();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error actualizando stock:", error);
      alert("Error al actualizar el stock");
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{maquina.nombre}</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {typeof maquina.ubicacion === 'string' ? maquina.ubicacion : maquina.ubicacion.direccion}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {maquina.imagen && (
        <div className="rounded-xl overflow-hidden border-2 border-gray-200">
          <img
            src={maquina.imagen}
            alt={maquina.nombre}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      <div className="border rounded-lg p-4 bg-white dark:bg-neutral-900">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Compartimentos y Productos
        </h3>

        <div className="space-y-4">
          {maquina.compartimentos.map((comp) => (
            <div
              key={comp.id}
              className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold">
                    Compartimento {comp.id.split("-").pop()}
                  </p>
                  {comp.producto || comp.tipoProducto ? (
                    <div className="mt-2">
                      <p className="font-medium">
                        {comp.producto ? comp.producto.nombre : (comp.tipoProducto as string)?.charAt(0).toUpperCase() + (comp.tipoProducto as string)?.slice(1)}
                      </p>
                      {comp.tipoGranelBola && (
                        <p className="text-xs text-gray-500 mt-1">
                          Tipo: {comp.tipoGranelBola === 'granel' ? 'Granel' : 'Bola'}
                        </p>
                      )}
                      {comp.producto && (
                        <>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Precio: ${comp.producto.precio} | Costo: ${comp.producto.costo}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Stock: {comp.cantidadActual} / {comp.capacidad}
                          </p>
                        </>
                      )}
                      {!comp.producto && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Stock: {comp.cantidadActual} / {comp.capacidad}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">Sin producto asignado</p>
                  )}
                </div>
              </div>

              {(comp.producto || comp.tipoProducto) ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      max={comp.capacidad}
                      value={comp.cantidadActual}
                      onChange={(e) =>
                        handleActualizarStock(comp.id, parseInt(e.target.value) || 0)
                      }
                      className="flex-1 bg-white text-black"
                    />
                    <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      / {comp.capacidad}
                    </span>
                  </div>
                  {!comp.producto && comp.tipoProducto && (
                    <p className="text-xs text-yellow-600 mt-2">
                      💡 Los costos de productos se registran en la pestaña &quot;Costos&quot;
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 italic">
                    {comp.tipoProducto 
                      ? `Producto: ${(comp.tipoProducto as string)?.charAt(0).toUpperCase() + (comp.tipoProducto as string)?.slice(1)}`
                      : "Sin producto asignado"}
                  </p>
                  {comp.tipoGranelBola && (
                    <p className="text-xs text-gray-400 mt-1">
                      Tipo: {comp.tipoGranelBola === 'granel' ? 'Granel' : 'Bola'}
                    </p>
                  )}
                  <p className="text-xs text-yellow-600 mt-2">
                    💡 Los costos de productos se registran en la pestaña &quot;Costos&quot;
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {maquina.notas && (
        <div className="border rounded-lg p-4 bg-white dark:bg-neutral-900">
          <h3 className="font-semibold mb-2">Notas</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{maquina.notas}</p>
        </div>
      )}
    </div>
  );
}

