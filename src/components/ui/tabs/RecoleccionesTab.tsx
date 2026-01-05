"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchWithUserId } from "~/lib/apiClient";
import { Button } from "~/components/ui/Button";
import { RecoleccionForm } from "~/components/vending/RecoleccionForm";
import type { Recoleccion, Maquina } from "~/lib/types";
import { DollarSign, Calendar, Package, MapPin, ArrowLeft } from "lucide-react";

interface RecoleccionesTabProps {
  userId: string;
}

export function RecoleccionesTab({ userId }: RecoleccionesTabProps) {
  const [recolecciones, setRecolecciones] = useState<Recoleccion[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroUbicacion, setFiltroUbicacion] = useState<string>("todas");
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState<Maquina | null>(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId, filtroUbicacion]);

  const loadData = async () => {
    try {
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

  // Obtener ubicaciones únicas
  const ubicaciones = Array.from(
    new Set(
      maquinas.map(m => 
        typeof m.ubicacion === 'string' ? m.ubicacion : m.ubicacion.direccion
      )
    )
  ).sort();

  // Filtrar máquinas por ubicación
  const maquinasFiltradas = filtroUbicacion === "todas"
    ? maquinas.filter(m => m.activa)
    : maquinas.filter(m => {
        const ubicacion = typeof m.ubicacion === 'string' ? m.ubicacion : m.ubicacion.direccion;
        return ubicacion === filtroUbicacion && m.activa;
      });

  // Filtrar recolecciones por ubicación
  const recoleccionesFiltradas = filtroUbicacion === "todas"
    ? recolecciones
    : recolecciones.filter(r => {
        const maquina = maquinas.find(m => m.id === r.maquinaId);
        if (!maquina) return false;
        const ubicacion = typeof maquina.ubicacion === 'string' ? maquina.ubicacion : maquina.ubicacion.direccion;
        return ubicacion === filtroUbicacion;
      });

  const getMaquinaNombre = (maquinaId: string) => {
    return maquinas.find((m) => m.id === maquinaId)?.nombre || maquinaId;
  };

  const totalIngresos = recoleccionesFiltradas.reduce((sum, r) => sum + r.ingresos, 0);

  if (loading) {
    return <div className="text-center py-4">Cargando...</div>;
  }

  // Si hay una máquina seleccionada, mostrar el formulario de recolección
  if (maquinaSeleccionada) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setMaquinaSeleccionada(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a lista</span>
        </button>
        <RecoleccionForm
          userId={userId}
          maquina={maquinaSeleccionada}
          onClose={() => setMaquinaSeleccionada(null)}
          onSave={() => {
            loadData();
            setMaquinaSeleccionada(null);
          }}
        />
      </div>
    );
  }

  // Si se quiere ver el historial
  if (mostrarHistorial) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setMostrarHistorial(false)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a máquinas</span>
        </button>

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Historial de Recolecciones</h2>
        </div>

        {/* Filtro por ubicación */}
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-900 dark:text-gray-100">Filtrar por ubicación:</label>
          <select
            value={filtroUbicacion}
            onChange={(e) => setFiltroUbicacion(e.target.value)}
            className="w-full h-12 rounded-xl border-2 border-blue-200 bg-white text-black px-4 focus:border-blue-500 focus:outline-none"
          >
            <option value="todas">Todas las ubicaciones</option>
            {ubicaciones.map((ubicacion) => (
              <option key={ubicacion} value={ubicacion}>
                {ubicacion}
              </option>
            ))}
          </select>
        </div>

        {/* Resumen */}
        {recoleccionesFiltradas.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="rounded-xl p-4 shadow-lg border-2 border-blue-200 bg-white"
              style={{
                boxShadow: "0 4px 15px rgba(59, 130, 246, 0.15)",
              }}
            >
              <p className="text-sm font-semibold text-gray-800 mb-1">Total Recolecciones</p>
              <p className="text-2xl font-bold text-blue-600">{recoleccionesFiltradas.length}</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="rounded-xl p-4 shadow-lg border-2 border-yellow-200 bg-white"
              style={{
                boxShadow: "0 4px 15px rgba(251, 191, 36, 0.15)",
              }}
            >
              <p className="text-sm font-semibold text-gray-800 mb-1">Ingresos Totales</p>
              <p className="text-2xl font-bold text-yellow-600">${totalIngresos.toFixed(2)}</p>
            </motion.div>
          </div>
        )}

        {/* Lista de recolecciones */}
        {recoleccionesFiltradas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay recolecciones registradas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recoleccionesFiltradas.map((recoleccion) => (
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
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800">{getMaquinaNombre(recoleccion.maquinaId)}</h3>
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
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">
                      ${recoleccion.ingresos.toFixed(2)}
                    </p>
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
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Vista principal: Lista de máquinas agrupadas por ubicación
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

      {/* Filtro por ubicación */}
      <div>
        <label className="block text-sm font-bold mb-2 text-gray-900 dark:text-gray-100">Filtrar por ubicación:</label>
          <select
            value={filtroUbicacion}
            onChange={(e) => setFiltroUbicacion(e.target.value)}
            className="w-full h-12 rounded-xl border-2 border-blue-200 bg-white text-black px-4 focus:border-blue-500 focus:outline-none"
          >
          <option value="todas">Todas las ubicaciones</option>
          {ubicaciones.map((ubicacion) => (
            <option key={ubicacion} value={ubicacion}>
              {ubicacion}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de máquinas agrupadas por ubicación */}
      {maquinasFiltradas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No hay máquinas activas</p>
          {filtroUbicacion !== "todas" && (
            <p className="text-sm mt-2">No hay máquinas en esta ubicación</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {ubicaciones
            .filter(ubicacion => filtroUbicacion === "todas" || ubicacion === filtroUbicacion)
            .map((ubicacion) => {
              const maquinasEnUbicacion = maquinasFiltradas.filter(m => {
                const ubi = typeof m.ubicacion === 'string' ? m.ubicacion : m.ubicacion.direccion;
                return ubi === ubicacion;
              });

              if (maquinasEnUbicacion.length === 0) return null;

              return (
                <motion.div
                  key={ubicacion}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                className="rounded-xl p-4 shadow-lg border-2 border-gray-200 bg-white"
                style={{
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
                }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-bold text-gray-800">{ubicacion}</h3>
                    <span className="px-2 py-1 bg-yellow-200 rounded-full text-xs font-semibold text-gray-800">
                      {maquinasEnUbicacion.length} {maquinasEnUbicacion.length === 1 ? 'máquina' : 'máquinas'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {maquinasEnUbicacion.map((maquina) => (
                      <motion.button
                        key={maquina.id}
                        onClick={() => setMaquinaSeleccionada(maquina)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-4 rounded-xl border-2 border-yellow-400 bg-white hover:bg-yellow-50 transition-colors text-left"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800">{maquina.nombre}</h4>
                            <div className="flex items-center gap-3 mt-1">
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
                </motion.div>
              );
            })}
        </div>
      )}
    </div>
  );
}
