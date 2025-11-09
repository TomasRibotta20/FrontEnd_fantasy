# 🔧 Solución de Problemas - Sistema de Jornadas

## ❌ Error: Pantalla Blanca en LoggedMenu

### Causa
El componente `WidgetPuntos` intenta cargar datos de endpoints que aún no existen.

### Solución Aplicada ✅
- El widget ahora maneja errores gracefully
- Si no puede cargar datos, simplemente no se muestra
- No rompe el resto de la interfaz

---

## ❌ Error 404: Cannot GET /jornadas

### Causa
El backend aún no tiene implementado el endpoint `/jornadas`

### Soluciones:

#### Opción 1: Implementar endpoints en el Backend (Recomendado)

Implementa los siguientes endpoints según la documentación:

**Endpoints Mínimos Requeridos:**

```javascript
// GET /jornadas - Listar todas las jornadas
app.get('/jornadas', async (req, res) => {
  const { temporada } = req.query;
  // Implementar lógica
  res.json([
    {
      id: 1,
      numero: 1,
      temporada: "2024",
      activa: true,
      permitirModificaciones: true,
      puntosCalculados: false
    }
  ]);
});

// GET /api/admin/config - Configuración del sistema
app.get('/api/admin/config', verificarAdmin, async (req, res) => {
  res.json({
    jornadaActiva: 1,
    modificacionesHabilitadas: true
  });
});

// GET /api/equipos/:id/historial - Historial de puntos
app.get('/api/equipos/:id/historial', verificarAuth, async (req, res) => {
  res.json({
    jornadas: [
      { jornadaId: 1, numero: 1, puntajeTotal: 35 },
      { jornadaId: 2, numero: 2, puntajeTotal: 42 }
    ]
  });
});
```

#### Opción 2: Usar Datos Mock (Temporal)

Si necesitas probar el frontend antes de tener el backend listo:

1. **Crear archivo de mocks:**

```typescript
// src/services/jornadasMock.ts
export const jornadasMock = [
  {
    id: 1,
    numero: 1,
    temporada: "2024",
    activa: true,
    permitirModificaciones: true,
    puntosCalculados: false,
    fechaInicio: "2024-01-01",
    fechaFin: "2024-01-07"
  },
  {
    id: 2,
    numero: 2,
    temporada: "2024",
    activa: false,
    permitirModificaciones: false,
    puntosCalculados: true,
    fechaInicio: "2024-01-08",
    fechaFin: "2024-01-14"
  }
];

export const historialMock = {
  jornadas: [
    { jornadaId: 1, numero: 1, puntajeTotal: 35 },
    { jornadaId: 2, numero: 2, puntajeTotal: 42 }
  ]
};
```

2. **Modificar servicios para usar mocks:**

```typescript
// En jornadasService.ts
const USE_MOCKS = true; // Cambiar a false cuando el backend esté listo

export const jornadasService = {
  async getJornadas(temporada?: string): Promise<Jornada[]> {
    if (USE_MOCKS) {
      return jornadasMock;
    }
    // ... código original
  },
};
```

---

## ❌ Error 403: Forbidden

### Causa
El usuario no tiene permisos de administrador o la sesión no es válida.

### Soluciones:

#### 1. Verificar que el usuario sea Admin

```sql
-- En tu base de datos, verificar el rol del usuario
SELECT * FROM usuarios WHERE id = 'tu_usuario_id';
-- Asegurarse que el campo 'rol' o 'isAdmin' sea true
```

#### 2. Verificar cookies de sesión

Abre las DevTools → Application → Cookies y verifica que existan las cookies de sesión.

#### 3. Deshabilitar verificación temporalmente (Solo para desarrollo)

En tu backend:

```javascript
// Middleware temporal que omite verificación
app.use('/api/admin', (req, res, next) => {
  // Solo en desarrollo
  if (process.env.NODE_ENV === 'development') {
    req.user = { id: 1, rol: 'admin' }; // Mock de usuario admin
  }
  next();
});
```

---

## ✅ Estado Actual del Sistema

### Componentes Listos ✅
- ✅ Todos los componentes de UI
- ✅ Manejo de errores graceful
- ✅ Componente de "Endpoint No Disponible"
- ✅ Rutas configuradas
- ✅ TypeScript sin errores
- ✅ Servicios con fallback

### Endpoints Necesarios ⏳
- ⏳ `GET /jornadas`
- ⏳ `GET /jornadas/:id`
- ⏳ `GET /api/admin/config`
- ⏳ `POST /api/admin/set-jornada-activa`
- ⏳ `POST /api/admin/deshabilitar-modificaciones`
- ⏳ `POST /api/admin/habilitar-modificaciones`
- ⏳ `POST /api/admin/jornadas/:id/procesar`
- ⏳ `POST /api/admin/jornadas/:id/recalcular`
- ⏳ `POST /api/estadisticas/jornadas/:id/actualizar`
- ⏳ `GET /api/estadisticas/jornadas/:id/puntajes`
- ⏳ `GET /api/equipos/:id/historial`
- ⏳ `GET /api/equipos/:id/jornadas/:jornadaId`

---

## 🧪 Cómo Probar el Frontend

### 1. Navegar a las rutas:

**Usuario normal:**
```
http://localhost:5173/jornadas
```

**Administrador:**
```
http://localhost:5173/admin/jornadas
```

### 2. Comportamiento esperado SIN backend:

- ✅ Muestra pantalla de "Funcionalidad en Desarrollo"
- ✅ Indica qué endpoints faltan
- ✅ Permite volver al menú principal
- ✅ No rompe la aplicación

### 3. Comportamiento esperado CON backend:

- ✅ Carga lista de jornadas
- ✅ Muestra configuración actual
- ✅ Permite gestionar jornadas (admin)
- ✅ Muestra puntos y estadísticas (usuarios)

---

## 🐛 Depuración

### Ver errores en consola:

```javascript
// Abre DevTools → Console
// Busca mensajes que empiecen con:
// "Error al cargar..."
// "Historial no disponible..."
// "Configuración no disponible..."
```

### Verificar requests en Network:

```
1. DevTools → Network
2. Filtrar por "XHR" o "Fetch"
3. Ver qué requests fallan
4. Verificar Status Code (404, 403, etc.)
```

### Verificar estado de autenticación:

```javascript
// En la consola del navegador:
localStorage.getItem('authUser');
// Debe mostrar información del usuario
```

---

## 📝 Checklist antes de usar el sistema

### Frontend ✅
- [x] Componentes creados
- [x] Rutas configuradas
- [x] Manejo de errores
- [x] TypeScript sin errores
- [x] Estilos aplicados

### Backend (Tu responsabilidad)
- [ ] Endpoints de jornadas implementados
- [ ] Endpoints de admin implementados
- [ ] Endpoints de estadísticas implementados
- [ ] Endpoints de equipos implementados
- [ ] Middleware de autenticación funcionando
- [ ] Middleware de autorización (admin) funcionando
- [ ] Base de datos con tablas necesarias
- [ ] CORS configurado correctamente

---

## 🚀 Próximos Pasos

1. **Implementar endpoints en el backend**
   - Usa la documentación en `BACKEND_ENDPOINTS_JORNADAS.md`
   - Implementa uno por uno y prueba cada uno

2. **Probar cada funcionalidad**
   - Crear jornada
   - Activar jornada
   - Bloquear/desbloquear modificaciones
   - Procesar jornada
   - Ver puntos

3. **Ajustar según sea necesario**
   - Si el formato de respuesta del backend es diferente
   - Si los nombres de campos son diferentes
   - Si hay lógica adicional necesaria

---

## 💡 Tips

- **No te preocupes por los errores 404 ahora**: Es normal, el backend aún no está listo
- **El frontend está 100% funcional**: Solo necesita que el backend responda
- **Los componentes manejan errores elegantemente**: No van a romper la app
- **Puedes desarrollar backend y frontend en paralelo**: El frontend está preparado para cuando los endpoints estén listos

---

## 📞 Contacto

Si tienes dudas sobre:
- **Frontend**: Ya está todo implementado y documentado
- **Backend**: Revisa `BACKEND_ENDPOINTS_JORNADAS.md` para la especificación completa

**El sistema está listo para funcionar tan pronto como el backend implemente los endpoints** 🎉
