# 🔍 Verificar Persistencia de Datos

## Problema: Los datos se borran al recargar

Si tus datos se borran al recargar la página, puede ser por:

1. **Variables de entorno no configuradas en Vercel** (producción)
2. **userId diferente entre sesiones** (FID vs Clerk)
3. **Error al guardar en Redis**

## ✅ Pasos para Diagnosticar

### 1. Verificar el endpoint de diagnóstico

Visita en tu navegador (o con curl):

**En desarrollo local:**
```
http://localhost:3000/api/debug/storage
```

**En producción (Vercel):**
```
https://tu-app.vercel.app/api/debug/storage
```

### 2. Revisar la respuesta

La respuesta debería mostrar:

```json
{
  "storage": {
    "type": "Upstash Redis",  // ✅ Debe decir esto
    "configured": true,        // ✅ Debe ser true
    "warning": null
  },
  "environment": {
    "hasUrl": true,            // ✅ Debe ser true
    "hasToken": true,           // ✅ Debe ser true
    "isValidUrl": true,         // ✅ Debe ser true
    "nodeEnv": "production"     // o "development"
  },
  "user": {
    "authenticated": true,
    "userId": "fid-744296",    // Tu userId actual
    "userIdType": "Farcaster FID" // o "Clerk"
  },
  "data": {
    "userId": "fid-744296",
    "maquinasCount": 2,         // Número de máquinas guardadas
    "recoleccionesCount": 5,    // Número de recolecciones
    "costosCount": 3,
    "sampleKeys": {
      "maquinasKey": "Gestión de Máquinas Vending:maquinas:fid-744296",
      "recoleccionesKey": "Gestión de Máquinas Vending:recolecciones:fid-744296",
      "costosKey": "Gestión de Máquinas Vending:costos:fid-744296"
    }
  }
}
```

### 3. Si `configured: false`

**Problema:** Las variables de entorno NO están configuradas en Vercel.

**Solución:**
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega:
   - `KV_REST_API_URL` = `https://tu-redis.upstash.io`
   - `KV_REST_API_TOKEN` = `tu-token-aqui`
5. **Re-deploy** la aplicación (Settings → Deployments → Redeploy)

### 4. Si `userId` cambia entre sesiones

**Problema:** Si usas FID en una sesión y Clerk en otra, los datos estarán en keys diferentes.

**Ejemplo:**
- Sesión 1: `userId = "fid-744296"` → datos en `maquinas:fid-744296`
- Sesión 2: `userId = "user_abc123"` → datos en `maquinas:user_abc123` (diferente!)

**Solución:** Asegúrate de usar siempre el mismo método de autenticación (FID o Clerk).

### 5. Verificar logs del servidor

Cuando guardas datos, deberías ver en los logs:

**Si está usando Redis:**
```
✅ Máquina guardada en Redis: Gestión de Máquinas Vending:maquina:fid-744296:maquina-123
✅ Recolección guardada en Redis: Gestión de Máquinas Vending:recolecciones:fid-744296
```

**Si NO está usando Redis:**
```
⚠️  Máquina guardada en memoria (se perderá al recargar): ...
```

## 🔧 Configuración Correcta

### Variables de entorno necesarias:

```bash
# .env.local (solo para desarrollo local)
KV_REST_API_URL=https://tu-redis.upstash.io
KV_REST_API_TOKEN=tu-token-aqui
```

**IMPORTANTE:** En Vercel, estas variables DEBEN estar configuradas en:
- **Settings** → **Environment Variables**
- Para el entorno **Production** (y opcionalmente Preview/Development)

## 📝 Checklist

- [ ] Variables configuradas en `.env.local` (desarrollo)
- [ ] Variables configuradas en Vercel Dashboard (producción)
- [ ] Re-deploy realizado después de agregar variables
- [ ] Endpoint `/api/debug/storage` muestra `configured: true`
- [ ] El `userId` es consistente entre sesiones
- [ ] Los logs muestran "✅ guardada en Redis"

## 🆘 Si sigue sin funcionar

1. Verifica que la URL de Upstash empiece con `https://`
2. Verifica que el token sea correcto (sin espacios)
3. Revisa los logs de Vercel para errores de conexión
4. Prueba crear una máquina y verificar en Upstash Dashboard que se guardó

