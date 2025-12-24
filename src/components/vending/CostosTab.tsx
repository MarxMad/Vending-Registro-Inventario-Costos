"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/input";
import type { CostoInsumo, TipoMaquina } from "~/lib/types";
import { Receipt, Plus, DollarSign, Package, TrendingDown, X } from "lucide-react";

interface CostosTabProps {
  userId: string;
}

export function CostosTab({ userId }: CostosTabProps) {
  const [costos, setCostos] = useState<CostoInsumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<TipoMaquina | "todos">("todos");

  useEffect(() => {
    loadCostos();
  }, [userId, filtroTipo]);

  const loadCostos = async () => {
    try {
      const response = await fetch(`/api/costos${filtroTipo !== "todos" ? `?tipo=${filtroTipo}` : ""}`);
      const data = await response.json();
      const costosOrdenados = (data.costos || []).sort(
        (a: CostoInsumo, b: CostoInsumo) =>
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      setCostos(costosOrdenados);
    } catch (error) {
      console.error("Error cargando costos:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalCostos = costos.reduce((sum, c) => sum + c.costoTotal, 0);
  const costosPeluches = costos.filter(c => c.tipoMaquina === "peluchera").reduce((sum, c) => sum + c.costoTotal, 0);
  const costosChicles = costos.filter(c => c.tipoMaquina === "chiclera").reduce((sum, c) => sum + c.costoTotal, 0);

  if (loading) {
    return <div className="text-center py-4">Cargando costos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Costos</h2>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Costo
        </Button>
      </div>

      {showForm && (
        <CostoForm
          userId={userId}
          onClose={() => setShowForm(false)}
          onSave={() => {
            loadCostos();
            setShowForm(false);
          }}
        />
      )}

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="rounded-xl p-4 shadow-lg border-2 border-red-200 bg-white"
          style={{
            boxShadow: "0 4px 15px rgba(239, 68, 68, 0.15)",
          }}
        >
          <p className="text-sm font-semibold text-gray-800 mb-1">Total Costos</p>
          <p className="text-2xl font-bold text-red-600">${totalCostos.toFixed(2)}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="rounded-xl p-4 shadow-lg border-2 border-yellow-200 bg-white"
          style={{
            boxShadow: "0 4px 15px rgba(251, 191, 36, 0.15)",
          }}
        >
          <p className="text-sm font-semibold text-gray-800 mb-1">Peluches</p>
          <p className="text-2xl font-bold text-yellow-600">${costosPeluches.toFixed(2)}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="rounded-xl p-4 shadow-lg border-2 border-blue-200 bg-white"
          style={{
            boxShadow: "0 4px 15px rgba(59, 130, 246, 0.15)",
          }}
        >
          <p className="text-sm font-semibold text-gray-800 mb-1">Chicleras</p>
          <p className="text-2xl font-bold text-blue-600">${costosChicles.toFixed(2)}</p>
        </motion.div>
      </div>

      {/* Filtro */}
      <div>
        <label className="block text-sm font-bold mb-2 text-gray-900 dark:text-gray-100">Filtrar por tipo:</label>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as TipoMaquina | "todos")}
          className="w-full h-12 rounded-xl border-2 border-blue-200 bg-white px-4 focus:border-blue-500 focus:outline-none"
        >
          <option value="todos">Todos</option>
          <option value="peluchera">Peluchera</option>
          <option value="chiclera">Chiclera</option>
        </select>
      </div>

      {/* Lista de costos */}
      {costos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No hay costos registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {costos.map((costo) => (
            <motion.div
              key={costo.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              className="rounded-xl p-4 shadow-lg border-2 border-gray-200 bg-white"
              style={{
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-red-600" />
                    <h3 className="font-bold text-gray-800">{costo.concepto}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      costo.tipoMaquina === "peluchera" 
                        ? "bg-yellow-500 text-white" 
                        : "bg-blue-500 text-white"
                    }`}>
                      {costo.tipoMaquina === "peluchera" ? "Peluchera" : "Chiclera"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(costo.fecha).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    Cantidad: {costo.cantidad} {costo.unidad}
                  </p>
                  {costo.proveedor && (
                    <p className="text-xs text-gray-500 mt-1">Proveedor: {costo.proveedor}</p>
                  )}
                  {costo.notas && (
                    <p className="text-xs text-gray-500 mt-1">{costo.notas}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-red-600">
                    ${costo.costoTotal.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    ${costo.costoUnitario.toFixed(2)} c/u
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

interface CostoFormProps {
  userId: string;
  onClose: () => void;
  onSave: () => void;
}

function CostoForm({ userId, onClose, onSave }: CostoFormProps) {
  const [maquinas, setMaquinas] = useState<any[]>([]);
  const [productosDisponibles, setProductosDisponibles] = useState<Array<{id: string, nombre: string, maquinaId: string, compartimentoId: string}>>([]);
  
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipoMaquina: "peluchera" as TipoMaquina,
    concepto: "",
    cantidad: 0,
    unidad: "unidades",
    costoTotal: 0,
    // Campos adicionales según unidad
    unidadesPorKg: 0, // Para kg
    kgPorCaja: 0, // Para cajas
    unidadesPorBolsas: 0, // Para bolsas
    proveedor: "",
    notas: "",
    productosRelacionados: [] as string[],
  });

  // Calcular costo unitario por unidad de compra (kg, caja, bolsa, etc.)
  const costoUnitario = formData.cantidad > 0 
    ? formData.costoTotal / formData.cantidad 
    : 0;

  // Calcular costo por unidad individual
  const calcularCostoPorUnidad = (): number => {
    if (formData.costoTotal <= 0 || formData.cantidad <= 0) return 0;

    switch (formData.unidad) {
      case "kg":
        if (formData.unidadesPorKg > 0) {
          // Costo del kg / unidades por kg
          return costoUnitario / formData.unidadesPorKg;
        }
        return 0;
      
      case "cajas":
        if (formData.kgPorCaja > 0 && formData.unidadesPorKg > 0) {
          // Costo de la caja / (kg por caja * unidades por kg)
          return costoUnitario / (formData.kgPorCaja * formData.unidadesPorKg);
        }
        return 0;
      
      case "bolsas":
        if (formData.unidadesPorBolsas > 0) {
          // Costo de la bolsa / unidades por bolsa
          return costoUnitario / formData.unidadesPorBolsas;
        }
        return 0;
      
      case "unidades":
      case "paquetes":
        // Si es unidades o paquetes, el costo unitario ya es por unidad
        return costoUnitario;
      
      default:
        return 0;
    }
  };

  const costoPorUnidad = calcularCostoPorUnidad();

  useEffect(() => {
    loadMaquinas();
  }, [userId, formData.tipoMaquina]);

  const loadMaquinas = async () => {
    try {
      const response = await fetch(`/api/maquinas`);
      const data = await response.json();
      const maquinasFiltradas = (data.maquinas || []).filter((m: any) => m.tipo === formData.tipoMaquina);
      setMaquinas(maquinasFiltradas);
      
      // Extraer productos disponibles
      const productos: Array<{id: string, nombre: string, maquinaId: string, compartimentoId: string}> = [];
      maquinasFiltradas.forEach((maquina: any) => {
        maquina.compartimentos.forEach((comp: any) => {
          const nombreProducto = comp.producto?.nombre || comp.tipoProducto || "";
          if (nombreProducto) {
            productos.push({
              id: `${maquina.id}-${comp.id}-${nombreProducto}`,
              nombre: `${nombreProducto.charAt(0).toUpperCase() + nombreProducto.slice(1)} (${maquina.nombre})`,
              maquinaId: maquina.id,
              compartimentoId: comp.id,
            });
          }
        });
      });
      setProductosDisponibles(productos);
    } catch (error) {
      console.error("Error cargando máquinas:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que haya cantidad y costo total
    if (formData.cantidad <= 0) {
      alert("La cantidad debe ser mayor a 0");
      return;
    }
    if (formData.costoTotal <= 0) {
      alert("El costo total debe ser mayor a 0");
      return;
    }

    // Validar campos adicionales según unidad
    if (formData.unidad === "kg" && formData.unidadesPorKg <= 0) {
      alert("Debes especificar cuántas unidades hay por kg");
      return;
    }
    if (formData.unidad === "cajas") {
      if (formData.kgPorCaja <= 0) {
        alert("Debes especificar cuántos kg hay por caja");
        return;
      }
      if (formData.unidadesPorKg <= 0) {
        alert("Debes especificar cuántas unidades hay por kg");
        return;
      }
    }
    if (formData.unidad === "bolsas" && formData.unidadesPorBolsas <= 0) {
      alert("Debes especificar cuántas unidades hay por bolsa");
      return;
    }

    try {
      const response = await fetch("/api/costos", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
          body: JSON.stringify({
            ...formData,
            costoUnitario: costoUnitario,
            costoTotal: formData.costoTotal,
            costoPorUnidad: costoPorUnidad,
            unidadesPorKg: formData.unidad === "kg" ? formData.unidadesPorKg : undefined,
            kgPorCaja: formData.unidad === "cajas" ? formData.kgPorCaja : undefined,
            unidadesPorBolsas: formData.unidad === "bolsas" ? formData.unidadesPorBolsas : undefined,
            fecha: new Date(formData.fecha).toISOString(),
            productosRelacionados: formData.productosRelacionados,
          }),
      });

      if (response.ok) {
        onSave();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error guardando costo:", error);
      alert("Error al guardar el costo");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6 shadow-xl border-2 border-yellow-400"
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #FEF3C7 100%)",
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-red-600">Nuevo Costo de Insumo</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-red-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-red-600" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">Fecha *</label>
          <Input
            type="date"
            value={formData.fecha}
            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            required
            className="border-2 border-yellow-300 bg-white text-black focus:border-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">Tipo de Máquina *</label>
          <select
            value={formData.tipoMaquina}
            onChange={(e) => setFormData({ ...formData, tipoMaquina: e.target.value as TipoMaquina })}
            className="w-full h-12 rounded-xl border-2 border-yellow-300 bg-white text-black px-4 focus:border-red-500 focus:outline-none"
            required
          >
            <option value="peluchera">Peluchera</option>
            <option value="chiclera">Chiclera</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">Concepto/Descripción *</label>
          <Input
            value={formData.concepto}
            onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
            placeholder="Ej: Chicles de fresa, Peluches pequeños, etc."
            required
            className="border-2 border-yellow-300 bg-white text-black focus:border-red-500"
          />
        </div>

        {/* Productos Relacionados */}
        {productosDisponibles.length > 0 && (
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">Productos Relacionados (opcional)</label>
            <p className="text-xs text-gray-600 mb-2">Selecciona los productos a los que aplica este costo</p>
            <div className="space-y-2 max-h-40 overflow-y-auto border-2 border-yellow-300 rounded-xl p-3 bg-white">
              {productosDisponibles.map((producto) => (
                <label key={producto.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.productosRelacionados.includes(producto.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          productosRelacionados: [...formData.productosRelacionados, producto.id],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          productosRelacionados: formData.productosRelacionados.filter(id => id !== producto.id),
                        });
                      }
                    }}
                    className="w-4 h-4 text-red-600 border-yellow-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-800">{producto.nombre}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">Cantidad *</label>
            <Input
              type="number"
              step="0.01"
              value={formData.cantidad || ""}
              onChange={(e) => setFormData({ ...formData, cantidad: parseFloat(e.target.value) || 0 })}
              required
              className="border-2 border-yellow-300 bg-white text-black focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">Unidad *</label>
            <select
              value={formData.unidad}
              onChange={(e) => {
                // Resetear campos adicionales al cambiar unidad
                setFormData({ 
                  ...formData, 
                  unidad: e.target.value,
                  unidadesPorKg: 0,
                  kgPorCaja: 0,
                  unidadesPorBolsas: 0,
                });
              }}
              className="w-full h-12 rounded-xl border-2 border-yellow-300 bg-white text-black px-4 focus:border-red-500 focus:outline-none"
              required
            >
              <option value="unidades">Unidades</option>
              <option value="kg">Kilogramos</option>
              <option value="cajas">Cajas</option>
              <option value="bolsas">Bolsas</option>
              <option value="paquetes">Paquetes</option>
            </select>
          </div>
        </div>

        {/* Campos adicionales según unidad */}
        {formData.unidad === "kg" && (
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">Unidades por kg *</label>
            <Input
              type="number"
              step="1"
              min="1"
              value={formData.unidadesPorKg || ""}
              onChange={(e) => setFormData({ ...formData, unidadesPorKg: parseInt(e.target.value) || 0 })}
              required
              className="border-2 border-yellow-300 bg-white text-black focus:border-red-500"
              placeholder="Ej: 100"
            />
            <p className="text-xs text-gray-500 mt-1">¿Cuántas unidades individuales hay en 1 kg?</p>
          </div>
        )}

        {formData.unidad === "cajas" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-800">Kg por caja *</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.kgPorCaja || ""}
                onChange={(e) => setFormData({ ...formData, kgPorCaja: parseFloat(e.target.value) || 0 })}
                required
                className="border-2 border-yellow-300 bg-white text-black focus:border-red-500"
                placeholder="Ej: 5"
              />
              <p className="text-xs text-gray-500 mt-1">¿Cuántos kg hay en 1 caja?</p>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-800">Unidades por kg *</label>
              <Input
                type="number"
                step="1"
                min="1"
                value={formData.unidadesPorKg || ""}
                onChange={(e) => setFormData({ ...formData, unidadesPorKg: parseInt(e.target.value) || 0 })}
                required
                className="border-2 border-yellow-300 bg-white text-black focus:border-red-500"
                placeholder="Ej: 100"
              />
              <p className="text-xs text-gray-500 mt-1">¿Cuántas unidades hay en 1 kg?</p>
            </div>
          </div>
        )}

        {formData.unidad === "bolsas" && (
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">Unidades por bolsa *</label>
            <Input
              type="number"
              step="1"
              min="1"
              value={formData.unidadesPorBolsas || ""}
              onChange={(e) => setFormData({ ...formData, unidadesPorBolsas: parseInt(e.target.value) || 0 })}
              required
              className="border-2 border-yellow-300 bg-white text-black focus:border-red-500"
              placeholder="Ej: 50"
            />
            <p className="text-xs text-gray-500 mt-1">¿Cuántas unidades individuales hay en 1 bolsa?</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">Costo Total ($) *</label>
          <Input
            type="number"
            step="0.01"
            value={formData.costoTotal || ""}
            onChange={(e) => setFormData({ ...formData, costoTotal: parseFloat(e.target.value) || 0 })}
            required
            className="border-2 border-yellow-300 bg-white text-black focus:border-red-500"
            placeholder="0.00"
          />
          {formData.cantidad > 0 && formData.costoTotal > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-600">
                Costo por {formData.unidad === "kg" ? "kg" : formData.unidad === "cajas" ? "caja" : formData.unidad === "bolsas" ? "bolsa" : formData.unidad === "paquetes" ? "paquete" : "unidad"}: ${costoUnitario.toFixed(2)}
              </p>
              {costoPorUnidad > 0 && (
                <p className="text-xs font-semibold text-blue-600">
                  Costo por unidad individual: ${costoPorUnidad.toFixed(4)}
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">Proveedor</label>
          <Input
            value={formData.proveedor}
            onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
            className="border-2 border-yellow-300 bg-white text-black focus:border-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">Notas</label>
          <textarea
            value={formData.notas}
            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
            className="w-full rounded-xl border-2 border-yellow-300 bg-white text-black px-4 py-3 focus:border-red-500 focus:outline-none"
            rows={3}
          />
        </div>

        <div className="pt-4 border-t-2 border-yellow-300">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Costo Total:</span>
              <span className="text-2xl font-bold text-red-600">
                ${formData.costoTotal.toFixed(2)}
              </span>
            </div>
            {formData.cantidad > 0 && formData.costoTotal > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Costo por {formData.unidad === "kg" ? "kg" : formData.unidad === "cajas" ? "caja" : formData.unidad === "bolsas" ? "bolsa" : formData.unidad === "paquetes" ? "paquete" : "unidad"}:</span>
                  <span className="text-lg font-semibold text-gray-700">
                    ${costoUnitario.toFixed(2)}
                  </span>
                </div>
                {costoPorUnidad > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-yellow-200">
                    <span className="text-sm font-semibold text-blue-600">Costo por unidad individual:</span>
                    <span className="text-lg font-bold text-blue-600">
                      ${costoPorUnidad.toFixed(4)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" onClick={onClose} variant="outline" className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            Guardar Costo
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

