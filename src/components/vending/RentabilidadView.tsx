"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Rentabilidad, Maquina } from "~/lib/types";
import { TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react";

interface RentabilidadViewProps {
  userId: string;
}

export function RentabilidadView({ userId }: RentabilidadViewProps) {
  const [rentabilidades, setRentabilidades] = useState<Rentabilidad[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"mes" | "trimestre" | "año">("mes");

  useEffect(() => {
    loadData();
  }, [userId, periodo]);

  const loadData = async () => {
    try {
      // Cargar máquinas
      const maquinasRes = await fetch(`/api/maquinas`);
      const maquinasData = await maquinasRes.json();
      setMaquinas(maquinasData.maquinas || []);

      // Calcular fechas según período
      const fin = new Date();
      const inicio = new Date();
      
      switch (periodo) {
        case "mes":
          inicio.setMonth(inicio.getMonth() - 1);
          break;
        case "trimestre":
          inicio.setMonth(inicio.getMonth() - 3);
          break;
        case "año":
          inicio.setFullYear(inicio.getFullYear() - 1);
          break;
      }

      const rentRes = await fetch(
        `/api/rentabilidad?inicio=${inicio.toISOString()}&fin=${fin.toISOString()}`
      );
      const rentData = await rentRes.json();
      setRentabilidades(rentData.rentabilidades || []);
    } catch (error) {
      console.error("Error cargando rentabilidad:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMaquinaNombre = (maquinaId: string) => {
    return maquinas.find((m) => m.id === maquinaId)?.nombre || maquinaId;
  };

  const totalIngresos = rentabilidades.reduce((sum, r) => sum + r.ingresosTotales, 0);
  const totalCostos = rentabilidades.reduce((sum, r) => sum + r.costosTotales, 0);
  const totalGanancia = rentabilidades.reduce((sum, r) => sum + r.gananciaNeta, 0);
  const margenPromedio =
    rentabilidades.length > 0
      ? rentabilidades.reduce((sum, r) => sum + r.margenGanancia, 0) / rentabilidades.length
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Rentabilidad</h2>
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value as "mes" | "trimestre" | "año")}
          className="h-12 rounded-xl border-2 border-blue-200 bg-white text-black px-4 focus:border-blue-500 focus:outline-none"
        >
          <option value="mes">Último Mes</option>
          <option value="trimestre">Último Trimestre</option>
          <option value="año">Último Año</option>
        </select>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="rounded-xl p-5 shadow-lg border-2 border-yellow-200 bg-white"
          style={{
            boxShadow: "0 4px 15px rgba(251, 191, 36, 0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-6 h-6 text-yellow-600" />
            <span className="text-sm font-semibold text-gray-700">Ingresos Totales</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">${totalIngresos.toFixed(2)}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="rounded-xl p-5 shadow-lg border-2 border-red-200 bg-white"
          style={{
            boxShadow: "0 4px 15px rgba(239, 68, 68, 0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-6 h-6 text-red-600" />
            <span className="text-sm font-semibold text-gray-700">Costos Totales</span>
          </div>
          <p className="text-3xl font-bold text-red-600">${totalCostos.toFixed(2)}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="rounded-xl p-5 shadow-lg border-2 border-blue-200 bg-white"
          style={{
            boxShadow: "0 4px 15px rgba(59, 130, 246, 0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Ganancia Neta</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">${totalGanancia.toFixed(2)}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="rounded-xl p-5 shadow-lg border-2 border-yellow-200 bg-white"
          style={{
            boxShadow: "0 4px 15px rgba(251, 191, 36, 0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6 text-yellow-600" />
            <span className="text-sm font-semibold text-gray-700">Margen Promedio</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{margenPromedio.toFixed(1)}%</p>
        </motion.div>
      </div>

      {/* Rentabilidad por Máquina */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-5 shadow-xl border-2 border-blue-200 bg-white"
        style={{
          boxShadow: "0 4px 20px rgba(59, 130, 246, 0.1)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-6 h-6 text-blue-600" />
          <h3 className="font-bold text-lg text-gray-800">Por Máquina</h3>
        </div>
        <div className="space-y-3">
          {rentabilidades.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay datos de rentabilidad para este período</p>
            </div>
          ) : (
            rentabilidades.map((rent, index) => (
              <motion.div
                key={rent.maquinaId}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="rounded-xl p-4 shadow-lg border-2 border-gray-200 bg-white"
                style={{
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800">{getMaquinaNombre(rent.maquinaId)}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {rent.recolecciones} recolección(es)
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-xl font-bold ${
                        rent.gananciaNeta >= 0 ? "text-blue-600" : "text-red-600"
                      }`}
                    >
                      ${rent.gananciaNeta.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {rent.margenGanancia.toFixed(1)}% margen
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-gray-600 mb-1">Ingresos</p>
                    <p className="font-semibold text-yellow-600">${rent.ingresosTotales.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Costos</p>
                    <p className="font-semibold text-red-600">${rent.costosTotales.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Recolecciones</p>
                    <p className="font-semibold text-gray-800">{rent.recolecciones}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

