"use client";

import { useEffect, useState } from "react";
import { fetchWithUserId } from "~/lib/apiClient";
import { Input } from "~/components/ui/input";
import type { Maquina, Recoleccion, Lugar } from "~/lib/types";
import { Package, X, DollarSign, Calendar, TrendingUp, History, Building2, MapPin } from "lucide-react";

interface MaquinaDetalleProps {
  userId: string;
  maquina: Maquina;
  onClose: () => void;
  onUpdate: () => void;
}

export function MaquinaDetalle({ userId, maquina, onClose, onUpdate }: MaquinaDetalleProps) {
  const [recolecciones, setRecolecciones] = useState<Recoleccion[]>([]);
  const [loadingRecolecciones, setLoadingRecolecciones] = useState(true);
  const [lugar, setLugar] = useState<Lugar | null>(null);

  useEffect(() => {
    loadRecolecciones();
    loadLugar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maquina.id, maquina.lugarId, userId]);

  const loadLugar = async () => {
    if (!maquina.lugarId) return;
    try {
      const response = await fetchWithUserId(`/api/lugares`, { userId });
      if (response.ok) {
        const data = await response.json();
        const lugarEncontrado = data.lugares?.find((l: Lugar) => l.id === maquina.lugarId);
        setLugar(lugarEncontrado || null);
      }
    } catch (error) {
      console.error("Error cargando lugar:", error);
    }
  };

  const loadRecolecciones = async () => {
    setLoadingRecolecciones(true);
    try {
      const response = await fetchWithUserId(`/api/recolecciones?maquinaId=${maquina.id}`, { userId });
      if (response.ok) {
        const data = await response.json();
        const recoleccionesData = data.recolecciones || [];
        // Ordenar por fecha (más recientes primero)
        recoleccionesData.sort((a: Recoleccion, b: Recoleccion) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        setRecolecciones(recoleccionesData);
      }
    } catch (error) {
      console.error("Error cargando recolecciones:", error);
    } finally {
      setLoadingRecolecciones(false);
    }
  };

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
          {lugar ? (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Building2 className="w-4 h-4" />
              <span className="font-semibold">{lugar.nombre}</span>
              <span className="text-gray-400">-</span>
              <MapPin className="w-4 h-4" />
              <span>{lugar.direccion}</span>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-500 text-sm">Sin lugar asignado</p>
          )}
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

      {/* Historial de Recolecciones */}
      <div className="border rounded-lg p-4 bg-white dark:bg-neutral-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <History className="w-5 h-5" />
            Historial de Recolecciones
          </h3>
          {recolecciones.length > 0 && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {recolecciones.length} recolección{recolecciones.length > 1 ? 'es' : ''}
            </span>
          )}
        </div>

        {loadingRecolecciones ? (
          <div className="text-center py-8 text-gray-500">
            <div className="spinner h-8 w-8 mx-auto mb-2"></div>
            <p>Cargando historial...</p>
          </div>
        ) : recolecciones.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay recolecciones registradas</p>
            <p className="text-sm">Las recolecciones aparecerán aquí cuando las registres</p>
          </div>
        ) : (
          <>
            {/* Estadísticas resumidas */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-700">Total Ingresos</span>
                </div>
                <p className="text-xl font-bold text-blue-600">
                  ${recolecciones.reduce((sum, r) => sum + (r.ingresosNetos ?? r.ingresos), 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border-2 border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold text-gray-700">Promedio por Recolección</span>
                </div>
                <p className="text-xl font-bold text-green-600">
                  ${(recolecciones.reduce((sum, r) => sum + (r.ingresosNetos ?? r.ingresos), 0) / recolecciones.length).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Lista de recolecciones */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recolecciones.map((recoleccion) => {
                const fecha = new Date(recoleccion.fecha);
                const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={recoleccion.id}
                    className="border-2 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {fechaFormateada}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          ${(recoleccion.ingresosNetos ?? recoleccion.ingresos).toFixed(2)}
                        </p>
                        {recoleccion.comisionLocal && recoleccion.comisionLocal > 0 && (
                          <p className="text-xs text-gray-500">
                            Comisión: {recoleccion.comisionLocal}%
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Información específica para pelucheras */}
                    {maquina.tipo === 'peluchera' && recoleccion.turnosRealizados && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 mb-2 border border-yellow-200">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Turnos:</span>
                            <span className="font-semibold ml-1">{recoleccion.turnosRealizados}</span>
                          </div>
                          {recoleccion.peluchesVendidos !== undefined && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Peluches:</span>
                              <span className="font-semibold ml-1">{recoleccion.peluchesVendidos}</span>
                            </div>
                          )}
                          {recoleccion.tasaConversion !== undefined && (
                            <div className="col-span-2">
                              <span className="text-gray-600 dark:text-gray-400">Tasa de Conversión:</span>
                              <span className="font-bold text-green-600 dark:text-green-400 ml-1">
                                {recoleccion.tasaConversion.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Productos vendidos - Optimizado para ambos tipos */}
                    {recoleccion.productosVendidos && recoleccion.productosVendidos.length > 0 && (
                      <div className={`mb-2 ${maquina.tipo === 'chiclera' ? 'bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 border border-orange-200' : ''}`}>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          {maquina.tipo === 'peluchera' ? 'Productos Vendidos:' : 'Productos Vendidos (Chiclera):'}
                        </p>
                        <div className="space-y-1">
                          {recoleccion.productosVendidos.map((pv, index) => {
                            // Para chicleras, mostrar más detalles
                            const precioUnitario = pv.cantidad > 0 ? pv.ingresos / pv.cantidad : 0;
                            return (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <div className="flex-1">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {pv.productoNombre}
                                  </span>
                                  {maquina.tipo === 'chiclera' && (
                                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                                      ({pv.cantidad} unidades × ${precioUnitario.toFixed(2)})
                                    </span>
                                  )}
                                  {maquina.tipo === 'peluchera' && (
                                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                                      x {pv.cantidad}
                                    </span>
                                  )}
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  ${pv.ingresos.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Costos adicionales */}
                    {recoleccion.costos && recoleccion.costos.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                          Costos Adicionales:
                        </p>
                        <div className="space-y-1">
                          {recoleccion.costos.map((costo, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-700 dark:text-gray-300">{costo.concepto}</span>
                              <span className="font-semibold text-red-600 dark:text-red-400">
                                -${costo.monto.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notas */}
                    {recoleccion.notas && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                          {recoleccion.notas}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

