"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Maquina, NotificacionRecoleccion, Recoleccion } from "~/lib/types";
import { AlertTriangle, TrendingUp, DollarSign, Package, Bell, Clock } from "lucide-react";
import { fetchWithUserId } from "~/lib/apiClient";

interface DashboardProps {
  userId: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
    },
  },
};

// Función helper para inicializar ingresos por día
const inicializarIngresosPorDia = () => {
  const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - (6 - i));
    fecha.setHours(0, 0, 0, 0);
    return fecha.toISOString().split('T')[0];
  });
  return ultimos7Dias.map((fecha) => ({ fecha, ingresos: 0 }));
};

export function Dashboard({ userId }: DashboardProps) {
  const [stats, setStats] = useState({
    totalMaquinas: 0,
    maquinasActivas: 0,
    notificacionesPendientes: 0,
    ingresosMes: 0,
  });
  const [notificaciones, setNotificaciones] = useState<NotificacionRecoleccion[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [_recolecciones, setRecolecciones] = useState<Recoleccion[]>([]);
  const [ingresosPorDia, setIngresosPorDia] = useState<Array<{ fecha: string; ingresos: number }>>(inicializarIngresosPorDia());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [userId]);

  // Recargar cuando el componente se monta o se vuelve visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboard();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      let maquinasData: Maquina[] = [];
      try {
        const maquinasRes = await fetchWithUserId(`/api/maquinas`, { userId });
        if (maquinasRes.ok) {
          const data = await maquinasRes.json();
          maquinasData = data.maquinas || [];
          setMaquinas(maquinasData);
        }
      } catch (error) {
        console.error("Error cargando máquinas:", error);
      }

      let notificacionesData: NotificacionRecoleccion[] = [];
      try {
        const notifRes = await fetchWithUserId(`/api/notificaciones-recoleccion`, { userId });
        if (notifRes.ok) {
          const data = await notifRes.json();
          notificacionesData = data.notificaciones || [];
          setNotificaciones(notificacionesData);
        }
      } catch (error) {
        console.error("Error cargando notificaciones:", error);
      }

      let ingresosMes = 0;
      let recoleccionesData: Recoleccion[] = [];
      try {
        const recoleccionesRes = await fetchWithUserId(`/api/recolecciones`, { userId });
        if (recoleccionesRes.ok) {
          const data = await recoleccionesRes.json();
          recoleccionesData = data.recolecciones || [];
          setRecolecciones(recoleccionesData);
          
          // Calcular ingresos del mes
          const inicioMes = new Date();
          inicioMes.setDate(1);
          const recoleccionesMes = recoleccionesData.filter(
            (r) => new Date(r.fecha) >= inicioMes
          );
          ingresosMes = recoleccionesMes.reduce((sum, r) => sum + r.ingresos, 0);

          // Calcular ingresos por día (últimos 7 días)
          const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - (6 - i));
            fecha.setHours(0, 0, 0, 0);
            return fecha.toISOString().split('T')[0];
          });

          const ingresosPorDiaData = ultimos7Dias.map((fecha) => {
            const ingresos = recoleccionesData
              .filter((r) => r.fecha.startsWith(fecha))
              .reduce((sum, r) => sum + r.ingresos, 0);
            return { fecha, ingresos };
          });
          setIngresosPorDia(ingresosPorDiaData);
        } else {
          // Si no hay recolecciones, mantener los datos iniciales (ceros)
          setIngresosPorDia(inicializarIngresosPorDia());
        }
      } catch (error) {
        console.error("Error cargando recolecciones:", error);
      }

      setStats({
        totalMaquinas: maquinasData.length,
        maquinasActivas: maquinasData.filter((m) => m.activa).length,
        notificacionesPendientes: notificacionesData.filter((n) => n.prioridad === "alta").length,
        ingresosMes,
      });
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const calcularProgresoRecoleccion = (maquina: Maquina): number => {
    if (!maquina.fechaUltimaRecoleccion) return 0;
    const ahora = new Date();
    const ultimaRecoleccion = new Date(maquina.fechaUltimaRecoleccion);
    const diasTranscurridos = Math.floor(
      (ahora.getTime() - ultimaRecoleccion.getTime()) / (1000 * 60 * 60 * 24)
    );
    const diasEstimados = maquina.diasRecoleccionEstimados || 7;
    return Math.min(100, (diasTranscurridos / diasEstimados) * 100);
  };

  const getDiasRestantes = (maquina: Maquina): number => {
    if (!maquina.fechaUltimaRecoleccion) return maquina.diasRecoleccionEstimados || 7;
    const ahora = new Date();
    const ultimaRecoleccion = new Date(maquina.fechaUltimaRecoleccion);
    const diasTranscurridos = Math.floor(
      (ahora.getTime() - ultimaRecoleccion.getTime()) / (1000 * 60 * 60 * 24)
    );
    const diasEstimados = maquina.diasRecoleccionEstimados || 7;
    return Math.max(0, diasEstimados - diasTranscurridos);
  };

  const maxIngresos = Math.max(...ingresosPorDia.map((d) => d.ingresos), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const maquinasOrdenadas = [...maquinas]
    .filter((m) => m.activa)
    .sort((a, b) => {
      const progresoA = calcularProgresoRecoleccion(a);
      const progresoB = calcularProgresoRecoleccion(b);
      return progresoB - progresoA;
    })
    .slice(0, 5);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Dashboard
        </h2>
      </motion.div>
        
      {/* Estadísticas rápidas */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="rounded-xl p-5 shadow-lg border-2 border-blue-200 bg-white"
          style={{
            boxShadow: "0 4px 15px rgba(59, 130, 246, 0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Total Máquinas</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.totalMaquinas}</p>
          <p className="text-xs text-gray-600 mt-1">{stats.maquinasActivas} activas</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="rounded-xl p-5 shadow-lg border-2 border-yellow-200 bg-white"
          style={{
            boxShadow: "0 4px 15px rgba(251, 191, 36, 0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-6 h-6 text-yellow-600" />
            <span className="text-sm font-semibold text-gray-700">Ingresos del Mes</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">${stats.ingresosMes.toFixed(2)}</p>
        </motion.div>
      </motion.div>

      {/* Gráfica de Ingresos (últimos 7 días) - Siempre visible */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl p-5 pb-6 shadow-xl border-2 border-blue-200 bg-white mb-2"
        style={{
          boxShadow: "0 4px 20px rgba(59, 130, 246, 0.1)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h3 className="font-bold text-lg text-gray-800">Ingresos (Últimos 7 Días)</h3>
        </div>
        <div className="flex items-end justify-between gap-2" style={{ minHeight: "140px" }}>
          {ingresosPorDia.map((dia, index) => {
            const altura = maxIngresos > 0 ? (dia.ingresos / maxIngresos) * 100 : 0;
            const fecha = new Date(dia.fecha);
            const nombreDia = fecha.toLocaleDateString("es-ES", { weekday: "short" });
            
            return (
              <motion.div
                key={dia.fecha}
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex-1 flex flex-col items-center gap-1.5 justify-end"
              >
                <div
                  className="w-full rounded-t-lg relative overflow-hidden bg-gray-100 flex-1 flex items-end"
                  style={{
                    minHeight: "60px",
                    maxHeight: "100px",
                  }}
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(altura, 5)}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                    className="w-full rounded-t"
                    style={{ 
                      minHeight: altura === 0 ? "4px" : "8px",
                      background: "linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)",
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 mt-1">
                  ${dia.ingresos.toFixed(0)}
                </span>
                <span className="text-xs text-gray-500">{nombreDia}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Estado de Máquinas con Barras de Progreso - Siempre visible */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl p-5 shadow-xl border-2 border-yellow-200 bg-white"
        style={{
          boxShadow: "0 4px 20px rgba(251, 191, 36, 0.1)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-6 h-6 text-yellow-600" />
          <h3 className="font-bold text-lg text-gray-800">Estado de Máquinas</h3>
        </div>
        {maquinasOrdenadas.length > 0 ? (
          <div className="space-y-4">
            {maquinasOrdenadas.map((maquina, index) => {
              const progreso = calcularProgresoRecoleccion(maquina);
              const diasRestantes = getDiasRestantes(maquina);
              const colorBarra = progreso >= 100 ? "bg-red-500" : progreso >= 75 ? "bg-yellow-500" : "bg-blue-500";
              
              return (
                <motion.div
                  key={maquina.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800">{maquina.nombre}</p>
                      <p className="text-xs text-gray-600">
                        {typeof maquina.ubicacion === 'string' ? maquina.ubicacion : maquina.ubicacion.direccion}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${progreso >= 100 ? 'text-red-600' : progreso >= 75 ? 'text-orange-600' : 'text-yellow-600'}`}>
                        {diasRestantes} días
                      </p>
                      <p className="text-xs text-gray-500">restantes</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progreso}%` }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                      className={`h-full ${colorBarra} rounded-full relative`}
                    >
                      {progreso > 20 && (
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                          {Math.round(progreso)}%
                        </span>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay máquinas activas registradas</p>
          </div>
        )}
      </motion.div>

      {/* Próximas Recolecciones - Siempre visible */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl p-5 shadow-xl border-2 border-red-200 bg-white"
        style={{
          boxShadow: "0 4px 20px rgba(239, 68, 68, 0.1)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </motion.div>
          <h3 className="font-bold text-lg text-gray-800">Próximas Recolecciones</h3>
        </div>
        {notificaciones.length > 0 ? (
          <div className="space-y-3">
            {notificaciones.slice(0, 3).map((notif, index) => (
              <motion.div
                key={notif.maquinaId}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-xl border-2 ${
                  notif.prioridad === "alta"
                    ? "bg-red-100 border-red-400"
                    : notif.prioridad === "media"
                    ? "bg-orange-100 border-orange-400"
                    : "bg-yellow-100 border-yellow-400"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-800">{notif.maquinaNombre}</p>
                      <p className="text-sm text-gray-700">
                        {notif.ubicacion}
                      </p>
                    <p className="text-xs mt-1 text-gray-600">
                      {notif.diasDesdeUltimaRecoleccion} días desde última recolección
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      notif.prioridad === "alta"
                        ? "bg-red-500 text-white"
                        : notif.prioridad === "media"
                        ? "bg-orange-500 text-white"
                        : "bg-yellow-500 text-white"
                    }`}
                  >
                    {notif.prioridad.toUpperCase()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay recolecciones pendientes</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
