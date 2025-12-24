"use client";

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/input";
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
  const [costos, setCostos] = useState<Array<{ concepto: string; monto: number }>>([]);
  const [nuevoCosto, setNuevoCosto] = useState({ concepto: "", monto: 0 });
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);

  const calcularIngresosTotales = () => {
    return productosVendidos.reduce((sum, p) => sum + p.ingresos, 0);
  };

  const handleAgregarProducto = (compartimentoId: string) => {
    const compartimento = maquina.compartimentos.find((c) => c.id === compartimentoId);
    if (!compartimento || !compartimento.producto) return;

    const cantidad = prompt(`Cantidad vendida de ${compartimento.producto.nombre}:`);
    if (!cantidad) return;

    const cantidadNum = parseInt(cantidad) || 0;
    if (cantidadNum <= 0) return;

    const ingresos = cantidadNum * compartimento.producto.precio;

    setProductosVendidos([
      ...productosVendidos,
      {
        compartimentoId,
        cantidad: cantidadNum,
        productoId: compartimento.producto.id,
        productoNombre: compartimento.producto.nombre,
        precio: compartimento.producto.precio,
        ingresos,
      },
    ]);
  };

  const handleEliminarProducto = (index: number) => {
    setProductosVendidos(productosVendidos.filter((_, i) => i !== index));
  };

  const handleAgregarCosto = () => {
    if (nuevoCosto.concepto && nuevoCosto.monto > 0) {
      setCostos([...costos, nuevoCosto]);
      setNuevoCosto({ concepto: "", monto: 0 });
    }
  };

  const handleEliminarCosto = (index: number) => {
    setCostos(costos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const recoleccion: Omit<Recoleccion, "id"> = {
        maquinaId: maquina.id,
        fecha: new Date().toISOString(),
        ingresos: calcularIngresosTotales(),
        productosVendidos: productosVendidos.map((p) => ({
          compartimentoId: p.compartimentoId,
          cantidad: p.cantidad,
          productoId: p.productoId,
          productoNombre: p.productoNombre,
          ingresos: p.ingresos,
        })),
        costos: costos.length > 0 ? costos : undefined,
        notas: notas || undefined,
      };

      const response = await fetch("/api/recolecciones", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recoleccion),
      });

      if (response.ok) {
        onSave();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
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
        <div>
          <label className="block text-sm font-medium mb-2">Productos Vendidos</label>
          <div className="space-y-2">
            {maquina.compartimentos.map((comp) => (
              <div key={comp.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex-1">
                  <p className="font-medium">
                    {comp.producto ? comp.producto.nombre : "Sin producto"}
                  </p>
                  {comp.producto && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Precio: ${comp.producto.precio} | Stock: {comp.cantidadActual}
                    </p>
                  )}
                </div>
                {comp.producto && (
                  <Button
                    type="button"
                    onClick={() => handleAgregarProducto(comp.id)}
                    size="sm"
                    variant="outline"
                  >
                    Agregar
                  </Button>
                )}
              </div>
            ))}
          </div>

          {productosVendidos.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Productos Registrados:</p>
              {productosVendidos.map((pv, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <div>
                    <p className="font-medium">{pv.productoNombre}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {pv.cantidad} x ${pv.precio} = ${pv.ingresos}
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
          <label className="block text-sm font-medium mb-2">Costos Adicionales</label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Concepto (ej: transporte, mantenimiento)"
              value={nuevoCosto.concepto}
              onChange={(e) => setNuevoCosto({ ...nuevoCosto, concepto: e.target.value })}
              className="flex-1 bg-white text-black"
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Monto"
              value={nuevoCosto.monto || ""}
              onChange={(e) =>
                setNuevoCosto({ ...nuevoCosto, monto: parseFloat(e.target.value) || 0 })
              }
              className="w-24 bg-white text-black"
            />
            <Button type="button" onClick={handleAgregarCosto} size="sm">
              +
            </Button>
          </div>
          {costos.length > 0 && (
            <div className="space-y-1">
              {costos.map((costo, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <span className="text-sm">
                    {costo.concepto}: ${costo.monto}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleEliminarCosto(index)}
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
          <label className="block text-sm font-medium mb-1">Notas</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full rounded-md border border-neutral-200 bg-white text-black px-3 py-2 dark:border-neutral-800 dark:bg-white dark:text-black"
            rows={3}
          />
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-lg">Total Ingresos:</span>
            <span className="font-bold text-lg text-green-600 dark:text-green-400">
              ${calcularIngresosTotales().toFixed(2)}
            </span>
          </div>
          {costos.length > 0 && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Costos:</span>
              <span className="text-sm text-red-600 dark:text-red-400">
                ${costos.reduce((sum, c) => sum + c.monto, 0).toFixed(2)}
              </span>
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

