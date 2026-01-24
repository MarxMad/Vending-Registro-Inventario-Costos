"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchWithUserId } from "~/lib/apiClient";
import { Button } from "~/components/ui/Button";
import { RecoleccionForm } from "~/components/vending/RecoleccionForm";
import type { Recoleccion, Maquina, Lugar } from "~/lib/types";
import { DollarSign, Calendar, Package, MapPin, ArrowLeft, Building2 } from "lucide-react";

interface RecoleccionesTabProps {
  userId: string;
}

export function RecoleccionesTab({ userId }: RecoleccionesTabProps) {
  const [recolecciones, setRecolecciones] = useState<Recoleccion[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [loading, setLoading] = useState(true);
  const [lugarSeleccionado, setLugarSeleccionado] = useState<Lugar | null>(null);
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState<Maquina | null>(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadData = async () => {
    try {
      // Cargar lugares
      const lugaresRes = await fetchWithUserId(`/api/lugares`, { userId });
      const lugaresData = await lugaresRes.json();
      setLugares(lugaresData.lugares || []);

      // Cargar máquinas
      const maquinasRes = await fetchWithUserId(`/api/maquinas`, { userId });
      const maquinasData = await maquinasRes.json();
      setMaquinas(maquinasData.maquinas || []);

      // Cargar recolecciones
      const recoleccionesRes = await fetchWithUserId(`/api/recolecciones`, { userId });
      const recoleccionesData = await recoleccionesRes.json();
      const recoleccionesOrdenadas = (recoleccionesData.recolecciones || []).sort(
        (a: Recoleccion, b: Recoleccion) =>
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      setRecolecciones(recoleccionesOrdenadas);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener máquinas del lugar seleccionado
  const maquinasDelLugar = lugarSeleccionado
    ? maquinas.filter(m => m.lugarId === lugarSeleccionado.id && m.activa)
    : [];

  const getMaquinaNombre = (maquinaId: string) => {
    return maquinas.find((m) => m.id === maquinaId)?.nombre || maquinaId;
  };

  if (loading) {
    return <div className="text-center py-4">Cargando...</div>;
  }

  // Si hay una máquina seleccionada, mostrar el formulario de recolección
  if (maquinaSeleccionada) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            setMaquinaSeleccionada(null);
            setLugarSeleccionado(null);
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a lugares</span>
        </button>
        <RecoleccionForm
          userId={userId}
          maquina={maquinaSeleccionada}
          onClose={() => {
            setMaquinaSeleccionada(null);
            setLugarSeleccionado(null);
          }}
          onSave={() => {
            loadData();
            setMaquinaSeleccionada(null);
            setLugarSeleccionado(null);
          }}
        />
      </div>
    );
  }

  // Si hay un lugar seleccionado, mostrar las máquinas de ese lugar
  if (lugarSeleccionado) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setLugarSeleccionado(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a lugares</span>
        </button>
        
        <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-bold text-lg text-gray-800">{lugarSeleccionado.nombre}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {lugarSeleccionado.direccion}
              </p>
            </div>
          </div>
        </div>

        {maquinasDelLugar.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay máquinas activas en este lugar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {maquinasDelLugar.map((maquina) => (
              <motion.button
                key={maquina.id}
                onClick={() => setMaquinaSeleccionada(maquina)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-4 rounded-xl border-2 border-yellow-400 bg-white hover:bg-yellow-50 transition-colors text-left"
              >
                <div className="flex gap-4 items-center">
                  {maquina.imagen ? (
                    <img
                      src={maquina.imagen}
                      alt={maquina.nombre}
                      className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{maquina.nombre}</h4>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        maquina.tipo === "peluchera" 
                          ? "bg-yellow-200 text-yellow-800" 
                          : "bg-orange-200 text-orange-800"
                      }`}>
                        {maquina.tipo === "peluchera" 
                          ? "Peluchera" 
                          : `Chiclera ${maquina.tipoChiclera === 'doble' ? 'Doble' : maquina.tipoChiclera === 'triple' ? 'Triple' : 'Individual'}`
                        }
                      </span>
                      {maquina.fechaUltimaRecoleccion && (
                        <span className="text-xs text-gray-600">
                          Última recolección: {new Date(maquina.fechaUltimaRecoleccion).toLocaleDateString("es-ES")}
                        </span>
                      )}
                    </div>
                  </div>
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Si se quiere ver el historial
  if (mostrarHistorial) {
    const recoleccionesParaHistorial = recolecciones;
    const totalIngresosHistorial = recoleccionesParaHistorial.reduce((sum, r) => sum + (r.ingresosNetos ?? r.ingresos), 0);

    return (
      <div className="space-y-4">
        <button
          onClick={() => setMostrarHistorial(false)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a lugares</span>
        </button>

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Historial de Recolecciones</h2>
        </div>

        {/* Resumen */}
        {recoleccionesParaHistorial.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="rounded-xl p-4 shadow-lg border-2 border-blue-200 bg-white"
              style={{
                boxShadow: "0 4px 15px rgba(59, 130, 246, 0.15)",
              }}
            >
              <p className="text-sm font-semibold text-gray-800 mb-1">Total Recolecciones</p>
              <p className="text-2xl font-bold text-blue-600">{recoleccionesParaHistorial.length}</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="rounded-xl p-4 shadow-lg border-2 border-yellow-200 bg-white"
              style={{
                boxShadow: "0 4px 15px rgba(251, 191, 36, 0.15)",
              }}
            >
              <p className="text-sm font-semibold text-gray-800 mb-1">Ingresos Totales</p>
              <p className="text-2xl font-bold text-yellow-600">${totalIngresosHistorial.toFixed(2)}</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="rounded-xl p-4 shadow-lg border-2 border-green-200 bg-white"
              style={{
                boxShadow: "0 4px 15px rgba(34, 197, 94, 0.15)",
              }}
            >
              <p className="text-sm font-semibold text-gray-800 mb-1">Ingresos Netos</p>
              <p className="text-2xl font-bold text-green-600">
                ${totalIngresosHistorial.toFixed(2)}
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="rounded-xl p-4 shadow-lg border-2 border-purple-200 bg-white"
              style={{
                boxShadow: "0 4px 15px rgba(168, 85, 247, 0.15)",
              }}
            >
              <p className="text-sm font-semibold text-gray-800 mb-1">Promedio por Recolección</p>
              <p className="text-2xl font-bold text-purple-600">
                ${(totalIngresosHistorial / recoleccionesParaHistorial.length).toFixed(2)}
              </p>
            </motion.div>
          </div>
        )}

        {/* Lista de recolecciones */}
        {recoleccionesParaHistorial.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay recolecciones registradas</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Agrupar recolecciones por fecha */}
            {Object.entries(
              recoleccionesParaHistorial.reduce((acc, recoleccion) => {
                const fechaKey = new Date(recoleccion.fecha).toISOString().split('T')[0]; // YYYY-MM-DD para ordenar
                const fechaDisplay = new Date(recoleccion.fecha).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
                if (!acc[fechaKey]) {
                  acc[fechaKey] = { fechaDisplay, recolecciones: [] };
                }
                acc[fechaKey].recolecciones.push(recoleccion);
                return acc;
              }, {} as Record<string, { fechaDisplay: string; recolecciones: Recoleccion[] }>)
            )
              .sort(([a], [b]) => b.localeCompare(a)) // Ordenar por fecha (más reciente primero)
              .map(([fechaKey, { fechaDisplay, recolecciones: recoleccionesDelDia }]) => (
                <div key={fechaKey} className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-800">{fechaDisplay}</h3>
                    <span className="px-2 py-1 bg-blue-100 rounded-full text-xs font-semibold text-blue-800">
                      {recoleccionesDelDia.length} {recoleccionesDelDia.length === 1 ? 'recolección' : 'recolecciones'}
                    </span>
                  </div>
                  {recoleccionesDelDia.map((recoleccion) => {
                    const maquina = maquinas.find(m => m.id === recoleccion.maquinaId);
                    return (
                <motion.div
                  key={recoleccion.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="rounded-xl p-4 shadow-lg border-2 border-gray-200 bg-white"
                  style={{
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <div className="flex gap-4">
                    {/* Imagen de la máquina - siempre mostrar */}
                    <div className="flex-shrink-0 relative">
                      {maquina?.imagen ? (
                        <>
                          <img
                            src={maquina.imagen}
                            alt={maquina.nombre}
                            className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                            onError={(e) => {
                              // Si la imagen falla al cargar, ocultar y mostrar placeholder
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const placeholder = target.parentElement?.querySelector('.image-placeholder') as HTMLElement;
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                          <div 
                            className="image-placeholder w-24 h-24 bg-gray-100 rounded-lg border-2 border-gray-200 items-center justify-center hidden"
                            style={{ display: 'none' }}
                          >
                            <Package className="w-10 h-10 text-gray-400" />
                          </div>
                        </>
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                          <Package className="w-10 h-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{getMaquinaNombre(recoleccion.maquinaId)}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(recoleccion.fecha).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {maquina && (() => {
                            const lugar = lugares.find(l => l.id === maquina.lugarId);
                            return lugar ? (
                              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <MapPin className="w-3 h-3" />
                                <span>{lugar.nombre} - {lugar.direccion}</span>
                              </div>
                            ) : null;
                          })()}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Ingresos Totales</p>
                          <p className="text-xl font-bold text-green-600">
                            ${recoleccion.ingresos.toFixed(2)}
                          </p>
                          {recoleccion.comisionLocal && recoleccion.comisionLocal > 0 && (
                            <>
                              <p className="text-xs text-gray-500 mt-1">Comisión ({recoleccion.comisionLocal}%)</p>
                              <p className="text-sm font-semibold text-red-600">
                                -${(recoleccion.ingresos * (recoleccion.comisionLocal / 100)).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">Ingresos Netos</p>
                              <p className="text-lg font-bold text-blue-600">
                                ${recoleccion.ingresosNetos.toFixed(2)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                {recoleccion.productosVendidos.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-yellow-300">
                    <p className="text-sm font-semibold mb-2 text-gray-800">Productos vendidos:</p>
                    <div className="space-y-1">
                      {recoleccion.productosVendidos.map((pv, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm text-gray-700"
                        >
                          <span>
                            {pv.cantidad}x {pv.productoNombre}
                          </span>
                          <span className="font-semibold">${pv.ingresos.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {recoleccion.costos && recoleccion.costos.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-yellow-300">
                    <p className="text-sm font-semibold mb-1 text-gray-800">Costos:</p>
                    <div className="space-y-1">
                      {recoleccion.costos.map((costo, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm text-red-600"
                        >
                          <span>{costo.concepto}</span>
                          <span className="font-semibold">${costo.monto.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                      {recoleccion.notas && (
                        <div className="mt-2 pt-2 border-t border-yellow-300">
                          <p className="text-xs text-gray-600 italic">{recoleccion.notas}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
                    );
                  })}
                </div>
              ))}
          </div>
        )}
      </div>
    );
  }

  // Vista principal: Lista de lugares
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recolecciones</h2>
        <Button 
          onClick={() => setMostrarHistorial(true)} 
          size="sm"
          variant="outline"
        >
          <Calendar className="w-4 h-4 mr-1" />
          Ver Historial
        </Button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 border-blue-200 mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>💡 Nuevo:</strong> Selecciona un lugar para ver todas las máquinas de ese lugar y registrar recolecciones.
        </p>
      </div>

      {/* Lista de lugares */}
      {lugares.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No hay lugares registrados</p>
          <p className="text-sm mt-2">Crea un lugar desde la pestaña &quot;Máquinas&quot; para comenzar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lugares.map((lugar) => {
            const maquinasEnLugar = maquinas.filter(m => m.lugarId === lugar.id && m.activa);
            return (
              <motion.button
                key={lugar.id}
                onClick={() => setLugarSeleccionado(lugar)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-4 rounded-xl border-2 border-blue-400 bg-white hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{lugar.nombre}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4" />
                        {lugar.direccion}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-yellow-200 rounded-full text-sm font-semibold text-gray-800">
                      {maquinasEnLugar.length} {maquinasEnLugar.length === 1 ? 'máquina' : 'máquinas'}
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
