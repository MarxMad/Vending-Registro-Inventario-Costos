"use client";

import { useEffect, useState } from "react";
import { fetchWithUserId } from "~/lib/apiClient";
import { Button } from "~/components/ui/Button";
import type { Maquina, Lugar } from "~/lib/types";
import { Plus, MapPin, Package, Calendar, Edit, Trash2, Info, Building2 } from "lucide-react";
import { MaquinaDetalle } from "./MaquinaDetalle";
import { MaquinaFormMejorado } from "./MaquinaFormMejorado";

interface MaquinasListProps {
  userId: string;
  onSelectMaquina: (maquina: Maquina) => void;
  onNuevaRecoleccion: (maquina: Maquina) => void; // Mantenido para compatibilidad pero no se usa
}

export function MaquinasList({ userId }: MaquinasListProps) {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMaquina, setEditingMaquina] = useState<Maquina | null>(null);
  const [detalleMaquina, setDetalleMaquina] = useState<Maquina | null>(null);

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
      const response = await fetchWithUserId(`/api/maquinas`, { userId });
      const data = await response.json();
      const maquinasData = data.maquinas || [];
      setMaquinas(maquinasData);
      
      // Debug: verificar imágenes
      maquinasData.forEach((m: Maquina) => {
        if (m.imagen) {
          console.log(`✅ Máquina "${m.nombre}" tiene imagen (longitud: ${m.imagen.length})`);
        } else {
          console.log(`⚠️  Máquina "${m.nombre}" NO tiene imagen`);
        }
      });
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (maquinaId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta máquina?")) return;
    
    try {
      const response = await fetchWithUserId(`/api/maquinas?maquinaId=${maquinaId}`, {
        method: "DELETE",
        userId,
      });
      if (response.ok) {
        loadMaquinas();
      }
    } catch (error) {
      console.error("Error eliminando máquina:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando máquinas...</div>;
  }

  if (detalleMaquina) {
    return (
      <MaquinaDetalle
        userId={userId}
        maquina={detalleMaquina}
        onClose={() => setDetalleMaquina(null)}
        onUpdate={() => {
          loadMaquinas();
          setDetalleMaquina(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mis Máquinas</h2>
        <Button
          onClick={() => {
            setEditingMaquina(null);
            setShowForm(true);
          }}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nueva
        </Button>
      </div>

      {showForm && (
        <MaquinaFormMejorado
          userId={userId}
          maquina={editingMaquina}
          onClose={() => {
            setShowForm(false);
            setEditingMaquina(null);
          }}
          onSave={() => {
            loadData();
            setShowForm(false);
            setEditingMaquina(null);
          }}
        />
      )}

      {maquinas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No tienes máquinas registradas</p>
          <p className="text-sm">Crea tu primera máquina para comenzar</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Agrupar máquinas por lugar */}
          {lugares.map((lugar) => {
            const maquinasEnLugar = maquinas.filter(m => m.lugarId === lugar.id);
            if (maquinasEnLugar.length === 0) return null;

            return (
              <div key={lugar.id} className="space-y-3">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-blue-200">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800">{lugar.nombre}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {lugar.direccion}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-200 rounded-full text-sm font-semibold text-gray-800">
                    {maquinasEnLugar.length} {maquinasEnLugar.length === 1 ? 'máquina' : 'máquinas'}
                  </span>
                </div>
                {maquinasEnLugar.map((maquina) => (
            <div
              key={maquina.id}
              className="border rounded-lg p-4 space-y-2 bg-white dark:bg-neutral-900"
            >
              {/* Imagen de la máquina - siempre mostrar, con placeholder si no hay */}
              <div className="mb-3 relative">
                {maquina.imagen && maquina.imagen.trim() !== '' ? (
                  <>
                    <img
                      src={maquina.imagen}
                      alt={maquina.nombre}
                      className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                      onLoad={() => {
                        console.log(`✅ Imagen cargada correctamente para máquina: ${maquina.nombre}`);
                      }}
                      onError={(e) => {
                        console.error(`❌ Error cargando imagen para máquina: ${maquina.nombre}`, e);
                        // Si la imagen falla al cargar, ocultar y mostrar placeholder
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.parentElement?.querySelector('.image-placeholder') as HTMLElement;
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                    />
                    <div 
                      className="image-placeholder w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-200 items-center justify-center hidden"
                      style={{ display: 'none' }}
                    >
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{maquina.nombre}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                      {maquina.tipo === "peluchera" ? "Peluchera" : `Chiclera ${maquina.tipoChiclera}`}
                    </span>
                    {maquina.activa ? (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-green-700 dark:text-green-300">
                        Activa
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
                        Inactiva
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingMaquina(maquina);
                      setShowForm(true);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(maquina.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {maquina.fechaUltimaRecoleccion && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Última recolección: {new Date(maquina.fechaUltimaRecoleccion).toLocaleDateString("es-ES")}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setDetalleMaquina(maquina)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Info className="w-4 h-4 mr-1" />
                  Ver Detalles
                </Button>
              </div>
            </div>
                ))}
              </div>
            );
          })}
          
          {/* Máquinas sin lugar asignado */}
          {maquinas.filter(m => !m.lugarId || !lugares.find(l => l.id === m.lugarId)).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-red-200">
                <Building2 className="w-6 h-6 text-red-600" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800">Sin Lugar Asignado</h3>
                  <p className="text-sm text-gray-500">Máquinas que no tienen lugar asignado</p>
                </div>
                <span className="px-3 py-1 bg-red-200 rounded-full text-sm font-semibold text-gray-800">
                  {maquinas.filter(m => !m.lugarId || !lugares.find(l => l.id === m.lugarId)).length} máquinas
                </span>
              </div>
              {maquinas.filter(m => !m.lugarId || !lugares.find(l => l.id === m.lugarId)).map((maquina) => (
                <div
                  key={maquina.id}
                  className="border rounded-lg p-4 space-y-2 bg-white dark:bg-neutral-900"
                >
                  {/* Imagen de la máquina - siempre mostrar, con placeholder si no hay */}
                  <div className="mb-3 relative">
                    {maquina.imagen && maquina.imagen.trim() !== '' ? (
                      <>
                        <img
                          src={maquina.imagen}
                          alt={maquina.nombre}
                          className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                          onLoad={() => {
                            console.log(`✅ Imagen cargada correctamente para máquina: ${maquina.nombre}`);
                          }}
                          onError={(e) => {
                            console.error(`❌ Error cargando imagen para máquina: ${maquina.nombre}`, e);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.parentElement?.querySelector('.image-placeholder') as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                        <div 
                          className="image-placeholder w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-200 items-center justify-center hidden"
                          style={{ display: 'none' }}
                        >
                          <Package className="w-16 h-16 text-gray-400" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{maquina.nombre}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                          {maquina.tipo === "peluchera" ? "Peluchera" : `Chiclera ${maquina.tipoChiclera}`}
                        </span>
                        {maquina.activa ? (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-green-700 dark:text-green-300">
                            Activa
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
                            Inactiva
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingMaquina(maquina);
                          setShowForm(true);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(maquina.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {maquina.fechaUltimaRecoleccion && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Última recolección: {new Date(maquina.fechaUltimaRecoleccion).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => setDetalleMaquina(maquina)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Info className="w-4 h-4 mr-1" />
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


