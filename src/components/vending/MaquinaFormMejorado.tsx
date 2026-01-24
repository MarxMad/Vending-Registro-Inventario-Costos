"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/input";
import { fetchWithUserId } from "~/lib/apiClient";
import type { Maquina, TipoMaquina, TipoChiclera, TipoProductoChiclera, ProductoChiclera, Lugar } from "~/lib/types";
import { X, Camera, Image as ImageIcon, Plus, Building2 } from "lucide-react";

interface MaquinaFormMejoradoProps {
  userId: string;
  maquina: Maquina | null;
  onClose: () => void;
  onSave: () => void;
}

const COLORES = [
  "Rojo", "Azul", "Amarillo", "Verde", "Naranja", "Rosa", "Morado", "Negro", "Blanco", "Gris"
];

const PRODUCTOS_CHICLERA: ProductoChiclera[] = ["chicles", "rocabola", "pelotas", "capsulas", "pokebolas"];

export function MaquinaFormMejorado({ userId, maquina, onClose, onSave }: MaquinaFormMejoradoProps) {
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [lugarSeleccionadoId, setLugarSeleccionadoId] = useState<string>(maquina?.lugarId || "");
  const [mostrarFormLugar, setMostrarFormLugar] = useState(false);
  const [nuevoLugar, setNuevoLugar] = useState({
    nombre: "",
    direccion: "",
    googleMapsUrl: "",
    notas: "",
  });
  const [cargandoLugares, setCargandoLugares] = useState(true);

  const [formData, setFormData] = useState({
    nombre: maquina?.nombre || "",
    color: maquina?.color || "",
    tipo: (maquina?.tipo || "peluchera") as TipoMaquina,
    tipoChiclera: (maquina?.tipoChiclera || "individual") as TipoChiclera,
    tiposProductoChiclera: maquina?.compartimentos.map(c => 
      c.tipoGranelBola || "granel"
    ) as TipoProductoChiclera[] || [] as TipoProductoChiclera[],
    productos: maquina?.compartimentos.map(c => {
      // Si tiene producto, usar el nombre del producto, si no usar tipoProducto
      return c.producto?.nombre || c.tipoProducto || "";
    }) || [] as string[],
    preciosVenta: maquina?.compartimentos.map(c => 
      c.precioVenta || c.producto?.precio || 0
    ) || [] as number[],
    diasRecoleccionEstimados: maquina?.diasRecoleccionEstimados || 7,
    notas: maquina?.notas || "",
    imagen: maquina?.imagen || "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(maquina?.imagen || null);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Cargar lugares al montar el componente
  useEffect(() => {
    loadLugares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadLugares = async () => {
    setCargandoLugares(true);
    try {
      const response = await fetchWithUserId("/api/lugares", { userId });
      if (response.ok) {
        const data = await response.json();
        setLugares(data.lugares || []);
      }
    } catch (error) {
      console.error("Error cargando lugares:", error);
    } finally {
      setCargandoLugares(false);
    }
  };

  const handleCrearLugar = async () => {
    if (!nuevoLugar.nombre.trim() || !nuevoLugar.direccion.trim()) {
      alert("El nombre y la dirección del lugar son requeridos");
      return;
    }

    try {
      const response = await fetchWithUserId("/api/lugares", {
        method: "POST",
        userId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoLugar.nombre,
          direccion: nuevoLugar.direccion,
          googleMapsUrl: nuevoLugar.googleMapsUrl || undefined,
          notas: nuevoLugar.notas || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await loadLugares();
        setLugarSeleccionadoId(data.lugar.id);
        setMostrarFormLugar(false);
        setNuevoLugar({ nombre: "", direccion: "", googleMapsUrl: "", notas: "" });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creando lugar:", error);
      alert("Error al crear el lugar");
    }
  };

  // Inicializar productos si es una máquina nueva
  useEffect(() => {
    if (!maquina && formData.productos.length === 0) {
      if (formData.tipo === "peluchera") {
        setFormData(prev => ({ 
          ...prev, 
          productos: ["peluches"], 
          tiposProductoChiclera: [],
          preciosVenta: [0]
        }));
      } else {
        const cantidad = formData.tipoChiclera === "doble" ? 2 : formData.tipoChiclera === "triple" ? 3 : 1;
        setFormData(prev => ({ 
          ...prev, 
          productos: Array(cantidad).fill(""),
          tiposProductoChiclera: Array(cantidad).fill("granel") as TipoProductoChiclera[],
          preciosVenta: Array(cantidad).fill(0)
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleProductoChange = (index: number, producto: string) => {
    const nuevosProductos = [...formData.productos];
    nuevosProductos[index] = producto;
    setFormData(prev => ({ ...prev, productos: nuevosProductos }));
  };

  const handleTipoProductoChange = (index: number, tipo: TipoProductoChiclera) => {
    const nuevosTipos = [...formData.tiposProductoChiclera];
    nuevosTipos[index] = tipo;
    setFormData(prev => ({ ...prev, tiposProductoChiclera: nuevosTipos }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('⚠️  No se seleccionó ningún archivo');
      return;
    }

    console.log(`📸 Archivo seleccionado: ${file.name}, tamaño: ${file.size} bytes, tipo: ${file.type}`);

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      console.log(`✅ Imagen convertida a base64 (longitud: ${base64String.length})`);
      setFormData(prev => ({ ...prev, imagen: base64String }));
      setImagenPreview(base64String);
      console.log('✅ Preview de imagen actualizado');
    };
    reader.onerror = (error) => {
      console.error('❌ Error leyendo archivo:', error);
      alert('Error al leer la imagen. Por favor intenta de nuevo.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imagen: "" }));
    setImagenPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevenir múltiples envíos
    if (isSaving) {
      console.log('⚠️  Ya se está guardando, ignorando envío duplicado');
      return;
    }

    // Limpiar errores anteriores
    setFormErrors({});
    const newErrors: Record<string, string> = {};

    // Validaciones
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre de la máquina es requerido.";
    }
    if (!lugarSeleccionadoId) {
      newErrors.lugarId = "Debes seleccionar o crear un lugar.";
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setIsSaving(false); // Asegurarse de que el botón no se quede deshabilitado
      return;
    }
    
    setIsSaving(true);
    console.log('💾 Iniciando guardado de máquina...');
    
    try {
      // Crear compartimentos según los productos seleccionados
      const compartimentos = formData.productos.map((producto, index) => ({
        id: maquina?.compartimentos[index]?.id || `comp-${Date.now()}-${index}`,
        producto: maquina?.compartimentos[index]?.producto || null,
        capacidad: formData.tipo === "peluchera" ? 50 : 200,
        cantidadActual: maquina?.compartimentos[index]?.cantidadActual || 0,
        tipoProducto: producto as any,
        // Guardar también el tipo (granel/bola) para chicleras
        tipoGranelBola: formData.tipo === "chiclera" ? formData.tiposProductoChiclera[index] : undefined,
        // Guardar precio de venta
        precioVenta: formData.preciosVenta[index] || 0,
      }));

      const url = "/api/maquinas";
      const method = maquina ? "PUT" : "POST";
      
      const response = await fetchWithUserId(url, {
        method,
        userId,
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(maquina && { id: maquina.id }),
          nombre: formData.nombre,
          color: formData.color,
          tipo: formData.tipo,
          tipoChiclera: formData.tipo === "chiclera" ? formData.tipoChiclera : undefined,
          tipoProductoChiclera: formData.tipo === "chiclera" && formData.tiposProductoChiclera.length > 0 
            ? formData.tiposProductoChiclera[0] 
            : undefined,
          lugarId: lugarSeleccionadoId,
          compartimentos,
          costoMaquina: 0, // Ya no se usa, pero mantenemos para compatibilidad
          fechaInstalacion: maquina?.fechaInstalacion || new Date().toISOString(),
          diasRecoleccionEstimados: formData.diasRecoleccionEstimados,
          activa: maquina?.activa ?? true,
          notas: formData.notas,
          imagen: formData.imagen || undefined,
        }),
      });

      if (response.ok) {
        console.log('✅ Máquina guardada exitosamente');
        // Pequeño delay para asegurar que el servidor haya guardado
        await new Promise(resolve => setTimeout(resolve, 100));
        onSave();
        // No resetear isSaving aquí porque onSave() cierra el formulario
      } else {
        const error = await response.json();
        console.error('❌ Error en respuesta:', error);
        alert(`Error: ${error.error}`);
        setIsSaving(false); // Permitir reintentar en caso de error
      }
    } catch (error) {
      console.error("❌ Error guardando máquina:", error);
      alert("Error al guardar la máquina. Por favor intenta de nuevo.");
      setIsSaving(false); // Permitir reintentar en caso de error
    }
  };

  const cantidadCompartimentos = formData.tipo === "chiclera" 
    ? (formData.tipoChiclera === "doble" ? 2 : formData.tipoChiclera === "triple" ? 3 : 1)
    : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6 shadow-xl border-2 border-yellow-400 relative"
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #FEF3C7 100%)",
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-red-600">
          {maquina ? "Editar Máquina" : "Nueva Máquina"}
        </h3>
        <button
          onClick={onClose}
          disabled={isSaving}
          className="p-2 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-5 h-5 text-red-600" />
        </button>
      </div>
      
      {/* Overlay de loading */}
      {isSaving && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
          <div className="bg-white rounded-xl p-6 shadow-xl border-2 border-blue-500">
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
              />
              <p className="text-lg font-semibold text-gray-800">
                Guardando máquina...
              </p>
              <p className="text-sm text-gray-600">
                Por favor espera, no cierres esta ventana
              </p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Nombre */}
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">Nombre *</label>
          <Input
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
            disabled={isSaving}
            className="border-2 border-yellow-300 bg-white text-black focus:border-red-500"
          />
          {formErrors.nombre && (
            <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>
          )}
        </div>

        {/* Foto de la Máquina */}
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">Foto de la Máquina</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isSaving}
            className="hidden"
            id="imagen-maquina"
          />
          <div className="space-y-2">
            {imagenPreview ? (
              <div className="relative">
                <img
                  src={imagenPreview}
                  alt="Vista previa de la máquina"
                  className="w-full h-48 object-cover rounded-xl border-2 border-yellow-300"
                  onLoad={() => {
                    console.log('✅ Preview de imagen cargado correctamente');
                  }}
                  onError={(e) => {
                    console.error('❌ Error cargando preview de imagen:', e);
                    alert('Error al mostrar la vista previa de la imagen');
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isSaving}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Eliminar imagen"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  Vista previa
                </div>
              </div>
            ) : (
              <label
                htmlFor="imagen-maquina"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-yellow-300 rounded-xl transition-colors ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-yellow-50'}`}
              >
                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Haz clic para subir una foto</span>
                <span className="text-xs text-gray-400 mt-1">Máximo 5MB</span>
              </label>
            )}
            {!imagenPreview && (
              <label
                htmlFor="imagen-maquina"
                className="block"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isSaving}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Seleccionar Imagen
                </Button>
              </label>
            )}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">Color *</label>
          <select
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            disabled={isSaving}
            className="w-full h-12 rounded-xl border-2 border-yellow-300 bg-white text-black px-4 focus:border-red-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            required
          >
            <option value="">Selecciona un color</option>
            {COLORES.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">Tipo *</label>
          <select
            value={formData.tipo}
            disabled={isSaving}
            onChange={(e) => {
              const nuevoTipo = e.target.value as TipoMaquina;
              if (nuevoTipo === "peluchera") {
                setFormData({ 
                  ...formData, 
                  tipo: nuevoTipo,
                  productos: ["peluches"],
                  tiposProductoChiclera: []
                });
              } else {
                const cantidad = formData.tipoChiclera === "doble" ? 2 : formData.tipoChiclera === "triple" ? 3 : 1;
                setFormData({ 
                  ...formData, 
                  tipo: nuevoTipo,
                  productos: Array(cantidad).fill(""),
                  tiposProductoChiclera: Array(cantidad).fill("granel") as TipoProductoChiclera[]
                });
              }
            }}
            className="w-full h-12 rounded-xl border-2 border-yellow-300 bg-white text-black px-4 focus:border-red-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            required
          >
            <option value="peluchera">Peluchera</option>
            <option value="chiclera">Chiclera</option>
          </select>
        </div>

        {/* Mueble (solo para chicleras) */}
        {formData.tipo === "chiclera" && (
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">Mueble *</label>
            <select
              value={formData.tipoChiclera}
              onChange={(e) => {
                const nuevoTipo = e.target.value as TipoChiclera;
                const cantidad = nuevoTipo === "doble" ? 2 : nuevoTipo === "triple" ? 3 : 1;
                setFormData({ 
                  ...formData, 
                  tipoChiclera: nuevoTipo,
                  productos: Array(cantidad).fill(""),
                  tiposProductoChiclera: Array(cantidad).fill("granel") as TipoProductoChiclera[]
                });
              }}
              disabled={isSaving}
              className="w-full h-12 rounded-xl border-2 border-yellow-300 bg-white text-black px-4 focus:border-red-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              required
            >
              <option value="individual">Individual</option>
              <option value="doble">Doble</option>
              <option value="triple">Triple</option>
            </select>
          </div>
        )}


        {/* Selección de Lugar */}
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-600" />
            Lugar * 
          </label>
          {formErrors.lugarId && (
            <p className="text-red-500 text-xs mb-2">{formErrors.lugarId}</p>
          )}
          
          {!mostrarFormLugar ? (
            <div className="space-y-2">
              {cargandoLugares ? (
                <div className="text-center py-4 text-gray-500">Cargando lugares...</div>
              ) : (
                <>
                  <select
                    value={lugarSeleccionadoId}
                    onChange={(e) => setLugarSeleccionadoId(e.target.value)}
                    required
                    disabled={isSaving}
                    className="w-full h-12 rounded-xl border-2 border-yellow-300 bg-white text-black px-4 focus:border-red-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Selecciona un lugar...</option>
                    {lugares.map((lugar) => (
                      <option key={lugar.id} value={lugar.id}>
                        {lugar.nombre} - {lugar.direccion}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    onClick={() => setMostrarFormLugar(true)}
                    variant="outline"
                    className="w-full"
                    disabled={isSaving}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Nuevo Lugar
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3 border-2 border-blue-200 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">Nuevo Lugar</h4>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormLugar(false);
                    setNuevoLugar({ nombre: "", direccion: "", googleMapsUrl: "", notas: "" });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Input
                placeholder="Nombre del lugar (ej: Centro Comercial)"
                value={nuevoLugar.nombre}
                onChange={(e) => setNuevoLugar({ ...nuevoLugar, nombre: e.target.value })}
                className="border-2 border-yellow-300 bg-white text-black"
              />
              <Input
                placeholder="Dirección completa"
                value={nuevoLugar.direccion}
                onChange={(e) => setNuevoLugar({ ...nuevoLugar, direccion: e.target.value })}
                className="border-2 border-yellow-300 bg-white text-black"
              />
              <Input
                placeholder="URL de Google Maps (opcional)"
                value={nuevoLugar.googleMapsUrl}
                onChange={(e) => setNuevoLugar({ ...nuevoLugar, googleMapsUrl: e.target.value })}
                className="border-2 border-yellow-300 bg-white text-black"
              />
              <Button
                type="button"
                onClick={handleCrearLugar}
                className="w-full"
                disabled={isSaving || !nuevoLugar.nombre.trim() || !nuevoLugar.direccion.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Lugar
              </Button>
            </div>
          )}
        </div>

        {/* Productos */}
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">Productos *</label>
          <div className="space-y-3">
            {formData.tipo === "peluchera" ? (
              <div className="space-y-2 p-3 rounded-xl border-2 border-yellow-200 bg-yellow-50">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Producto *</label>
                  <select
                    value={formData.productos[0] || ""}
                    onChange={(e) => handleProductoChange(0, e.target.value)}
                    disabled={isSaving}
                    className="w-full h-12 rounded-xl border-2 border-yellow-300 bg-white text-black px-4 focus:border-red-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="peluches">Peluches</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Precio de Venta ($) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.preciosVenta[0] || ""}
                    onChange={(e) => {
                      const nuevosPrecios = [...formData.preciosVenta];
                      nuevosPrecios[0] = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, preciosVenta: nuevosPrecios });
                    }}
                    placeholder="0.00"
                    required
                    disabled={isSaving}
                    className="border-2 border-yellow-300 bg-white text-black focus:border-red-500"
                  />
                </div>
              </div>
            ) : (
              Array.from({ length: cantidadCompartimentos }).map((_, index) => (
                <div key={index} className="space-y-2 p-3 rounded-xl border-2 border-yellow-200 bg-yellow-50">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Compartimento {index + 1}
                  </label>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Producto *</label>
                      <select
                        value={formData.productos[index] || ""}
                        onChange={(e) => handleProductoChange(index, e.target.value)}
                        disabled={isSaving}
                        className="w-full h-12 rounded-xl border-2 border-yellow-300 bg-white text-black px-4 focus:border-red-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      >
                        <option value="">Selecciona producto</option>
                        {PRODUCTOS_CHICLERA.map(producto => (
                          <option key={producto} value={producto}>
                            {producto.charAt(0).toUpperCase() + producto.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Tipo (Granel o Bola) *</label>
                      <select
                        value={formData.tiposProductoChiclera[index] || "granel"}
                        onChange={(e) => handleTipoProductoChange(index, e.target.value as TipoProductoChiclera)}
                        disabled={isSaving}
                        className="w-full h-12 rounded-xl border-2 border-yellow-300 bg-white text-black px-4 focus:border-red-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      >
                        <option value="granel">Granel</option>
                        <option value="bola">Bola</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Precio de Venta ($) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.preciosVenta[index] || ""}
                        onChange={(e) => {
                          const nuevosPrecios = [...formData.preciosVenta];
                          nuevosPrecios[index] = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, preciosVenta: nuevosPrecios });
                        }}
                        placeholder="0.00"
                        required
                        disabled={isSaving}
                        className="border-2 border-yellow-300 bg-white text-black focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Días Estimados */}
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">Días Estimados entre Recolecciones *</label>
          <Input
            type="number"
            value={formData.diasRecoleccionEstimados}
            onChange={(e) => setFormData({ ...formData, diasRecoleccionEstimados: parseInt(e.target.value) || 7 })}
            required
            disabled={isSaving}
            className="border-2 border-yellow-300 bg-white text-black focus:border-red-500"
          />
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-800">Notas</label>
          <textarea
            value={formData.notas}
            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
            disabled={isSaving}
            className="w-full rounded-xl border-2 border-yellow-300 bg-white text-black px-4 py-3 focus:border-red-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            type="button" 
            onClick={onClose} 
            variant="outline" 
            className="flex-1"
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="flex-1"
            isLoading={isSaving}
            disabled={isSaving}
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

