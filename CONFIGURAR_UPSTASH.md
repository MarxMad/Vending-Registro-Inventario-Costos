# 🔧 Configurar Upstash Redis para Persistencia de Datos

## ⚠️ Problema Actual

Si tus datos se borran al recargar la página, significa que **Upstash Redis NO está configurado** y la aplicación está usando almacenamiento en memoria.

## ✅ Solución: Configurar Upstash Redis

### 1. Crear cuenta en Upstash

1. Ve a [https://upstash.com](https://upstash.com)
2. Crea una cuenta gratuita (tiene 10,000 comandos/día gratis)
3. Haz clic en "Create Database"

### 2. Crear base de datos Redis

1. Elige la región más cercana a tus usuarios
2. Elige el plan "Free" (suficiente para empezar)
3. Haz clic en "Create"
4. Espera a que se cree la base de datos (1-2 minutos)

### 3. Obtener credenciales

Una vez creada la base de datos:

1. Ve a la pestaña "REST API"
2. Copia:
   - **UPSTASH_REDIS_REST_URL** (URL de la API)
   - **UPSTASH_REDIS_REST_TOKEN** (Token de autenticación)

### 4. Configurar variables de entorno

#### En desarrollo local (`.env.local`):

```bash
KV_REST_API_URL=https://tu-redis.upstash.io
KV_REST_API_TOKEN=tu-token-aqui
```

#### En Vercel (Producción):

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a **Settings** → **Environment Variables**
3. Agrega:
   - `KV_REST_API_URL` = `https://tu-redis.upstash.io`
   - `KV_REST_API_TOKEN` = `tu-token-aqui`
4. Haz clic en **Save**
5. **Re-deploy** tu aplicación para que tome las nuevas variables

## 🔍 Verificar que funciona

Después de configurar:

1. Reinicia tu servidor de desarrollo
2. Deberías ver en la consola: `✅ Usando Upstash Redis para almacenamiento persistente`
3. Crea una máquina o recolección
4. Recarga la página
5. Los datos deberían persistir ✅

## 📊 Cómo funciona Upstash Redis

- **No necesita SQL** - Es una base de datos NoSQL tipo clave-valor
- **Funciona vía HTTP REST API** - No necesitas instalar nada
- **Serverless** - Se escala automáticamente
- **Gratis hasta 10,000 comandos/día** - Suficiente para desarrollo y uso moderado

## 🚨 Si sigues teniendo problemas

1. Verifica que las variables estén correctamente escritas (sin espacios)
2. Verifica que la URL empiece con `https://`
3. Verifica que el token sea correcto
4. Revisa los logs del servidor para ver si hay errores de conexión

