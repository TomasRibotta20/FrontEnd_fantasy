# 🔧 Implementación Requerida en el Backend

## Problema Actual

El frontend está enviando las peticiones correctamente, pero el backend necesita implementar la lógica para:

1. **Guardar el estado de configuración** (jornada activa y modificaciones habilitadas)
2. **Actualizar las jornadas** para marcar cuál está activa
3. **Retornar la configuración actual** cuando se solicite

---

## 📋 Endpoints que Deben Funcionar

### 1. GET /api/admin/config

**Propósito**: Obtener la configuración actual del sistema

**Response esperado**:

```json
{
  "success": true,
  "data": {
    "jornadaActiva": 2, // ID de la jornada activa (null si ninguna)
    "modificacionesHabilitadas": true // Si los usuarios pueden modificar equipos
  }
}
```

**Implementación sugerida**:

```javascript
// Puede guardar esto en memoria, base de datos, o archivo
let configuracionSistema = {
  jornadaActiva: null,
  modificacionesHabilitadas: false,
};

router.get('/admin/config', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    data: configuracionSistema,
  });
});
```

---

### 2. POST /api/admin/set-jornada-activa

**Propósito**: Establecer cuál jornada está activa actualmente

**Request body**:

```json
{
  "jornadaId": "2" // Puede venir como string o number
}
```

**Lógica requerida**:

1. Convertir `jornadaId` a número
2. Verificar que la jornada existe
3. **Desactivar todas las jornadas**: `UPDATE jornadas SET activa = false`
4. **Activar la jornada seleccionada**: `UPDATE jornadas SET activa = true WHERE id = jornadaId`
5. **Guardar en config**: `configuracionSistema.jornadaActiva = jornadaId`

**Response esperado**:

```json
{
  "success": true,
  "message": "Jornada 2nd Phase - 2 establecida como activa",
  "data": {
    "jornadaId": 2
  }
}
```

**Implementación sugerida**:

```javascript
router.post(
  '/admin/set-jornada-activa',
  authenticateAdmin,
  async (req, res) => {
    try {
      const jornadaId = parseInt(req.body.jornadaId);

      if (isNaN(jornadaId)) {
        return res.status(400).json({
          success: false,
          message: 'jornadaId debe ser un número válido',
        });
      }

      // Verificar que la jornada existe
      const jornada = await Jornada.findByPk(jornadaId);
      if (!jornada) {
        return res.status(404).json({
          success: false,
          message: `Jornada con ID ${jornadaId} no encontrada`,
        });
      }

      // Desactivar todas las jornadas
      await Jornada.update({ activa: false }, { where: {} });

      // Activar la jornada seleccionada
      await Jornada.update({ activa: true }, { where: { id: jornadaId } });

      // Guardar en configuración
      configuracionSistema.jornadaActiva = jornadaId;

      res.json({
        success: true,
        message: `Jornada ${jornada.nombre} establecida como activa`,
        data: { jornadaId },
      });
    } catch (error) {
      console.error('Error al establecer jornada activa:', error);
      res.status(500).json({
        success: false,
        message: 'Error al establecer jornada activa',
        error: error.message,
      });
    }
  }
);
```

---

### 3. POST /api/admin/habilitar-modificaciones

**Propósito**: Permitir que los usuarios modifiquen sus equipos

**Request body**: _(vacío)_

**Lógica requerida**:

1. **Actualizar todas las jornadas**: `UPDATE jornadas SET permitirModificaciones = true`
2. **Guardar en config**: `configuracionSistema.modificacionesHabilitadas = true`

**Response esperado**:

```json
{
  "success": true,
  "message": "Modificaciones habilitadas para todos los usuarios"
}
```

**Implementación sugerida**:

```javascript
router.post(
  '/admin/habilitar-modificaciones',
  authenticateAdmin,
  async (req, res) => {
    try {
      // Habilitar modificaciones en todas las jornadas
      await Jornada.update({ permitirModificaciones: true }, { where: {} });

      // Guardar en configuración
      configuracionSistema.modificacionesHabilitadas = true;

      res.json({
        success: true,
        message: 'Modificaciones habilitadas para todos los usuarios',
      });
    } catch (error) {
      console.error('Error al habilitar modificaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al habilitar modificaciones',
        error: error.message,
      });
    }
  }
);
```

---

### 4. POST /api/admin/deshabilitar-modificaciones

**Propósito**: Bloquear los equipos para que los usuarios no puedan modificarlos

**Request body**: _(vacío)_

**Lógica requerida**:

1. **Actualizar todas las jornadas**: `UPDATE jornadas SET permitirModificaciones = false`
2. **Guardar en config**: `configuracionSistema.modificacionesHabilitadas = false`

**Response esperado**:

```json
{
  "success": true,
  "message": "Modificaciones deshabilitadas para todos los usuarios"
}
```

**Implementación sugerida**:

```javascript
router.post(
  '/admin/deshabilitar-modificaciones',
  authenticateAdmin,
  async (req, res) => {
    try {
      // Deshabilitar modificaciones en todas las jornadas
      await Jornada.update({ permitirModificaciones: false }, { where: {} });

      // Guardar en configuración
      configuracionSistema.modificacionesHabilitadas = false;

      res.json({
        success: true,
        message: 'Modificaciones deshabilitadas para todos los usuarios',
      });
    } catch (error) {
      console.error('Error al deshabilitar modificaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al deshabilitar modificaciones',
        error: error.message,
      });
    }
  }
);
```

---

## 🗄️ Modelo de Base de Datos

Asegúrate de que la tabla `jornadas` tenga estos campos:

```sql
CREATE TABLE jornadas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  temporada VARCHAR(10),
  etapa VARCHAR(100),
  liga_id INT,
  activa BOOLEAN DEFAULT FALSE,           -- ⭐ IMPORTANTE
  permitirModificaciones BOOLEAN DEFAULT TRUE,  -- ⭐ IMPORTANTE
  puntosCalculados BOOLEAN DEFAULT FALSE,
  fecha_inicio DATETIME,
  fecha_fin DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Campos clave**:

- `activa`: Indica si esta jornada es la activa actualmente (solo una debe ser `true`)
- `permitirModificaciones`: Indica si los usuarios pueden modificar sus equipos para esta jornada

---

## 🔍 Cómo Verificar que Funciona

### 1. Probar GET /api/admin/config

```bash
curl http://localhost:3000/api/admin/config -H "Cookie: connect.sid=YOUR_SESSION"
```

**Debe devolver**:

```json
{
  "success": true,
  "data": {
    "jornadaActiva": null,
    "modificacionesHabilitadas": false
  }
}
```

### 2. Probar establecer jornada activa

```bash
curl -X POST http://localhost:3000/api/admin/set-jornada-activa \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{"jornadaId": "2"}'
```

**Debe devolver**:

```json
{
  "success": true,
  "message": "Jornada 2nd Phase - 2 establecida como activa",
  "data": { "jornadaId": 2 }
}
```

### 3. Verificar que la jornada se marcó como activa

```bash
curl http://localhost:3000/api/jornadas
```

**Debe mostrar**:

```json
{
  "data": [
    {
      "id": 1,
      "nombre": "2nd Phase - 1",
      "activa": false,  // ← Esta debe estar en false
      ...
    },
    {
      "id": 2,
      "nombre": "2nd Phase - 2",
      "activa": true,   // ← Esta debe estar en true ⭐
      ...
    }
  ]
}
```

### 4. Verificar que la config se actualizó

```bash
curl http://localhost:3000/api/admin/config -H "Cookie: connect.sid=YOUR_SESSION"
```

**Debe devolver**:

```json
{
  "success": true,
  "data": {
    "jornadaActiva": 2, // ← Ahora debe ser 2 ⭐
    "modificacionesHabilitadas": false
  }
}
```

---

## ✅ Checklist de Implementación

- [ ] Crear variable `configuracionSistema` en memoria o base de datos
- [ ] Implementar `GET /api/admin/config`
- [ ] Implementar `POST /api/admin/set-jornada-activa`
  - [ ] Desactiva todas las jornadas
  - [ ] Activa la jornada seleccionada
  - [ ] Actualiza `configuracionSistema.jornadaActiva`
- [ ] Implementar `POST /api/admin/habilitar-modificaciones`
  - [ ] Actualiza `permitirModificaciones = true` en todas las jornadas
  - [ ] Actualiza `configuracionSistema.modificacionesHabilitadas`
- [ ] Implementar `POST /api/admin/deshabilitar-modificaciones`
  - [ ] Actualiza `permitirModificaciones = false` en todas las jornadas
  - [ ] Actualiza `configuracionSistema.modificacionesHabilitadas`
- [ ] Agregar campos `activa` y `permitirModificaciones` a la tabla `jornadas`
- [ ] Probar todos los endpoints con curl o Postman

---

## 🎯 Resultado Esperado

Una vez implementado correctamente:

1. **Al establecer jornada activa**: El frontend muestra "2" en el widget y la jornada 2 tiene `activa: true`
2. **Al recargar la página**: El estado persiste porque se carga del servidor
3. **Al ir a detalles de jornada**: Muestra "🟢 Activa" porque el campo `activa` está en `true`
4. **Al habilitar/bloquear modificaciones**: El estado se guarda y persiste en el servidor

---

## 💡 Notas Adicionales

- La configuración puede guardarse en **memoria** (simple pero se pierde al reiniciar el servidor) o en **base de datos** (persistente)
- Solo **una jornada** debe tener `activa = true` a la vez
- El middleware `authenticateAdmin` debe verificar que el usuario tenga rol de administrador
- Los endpoints retornan `{ success: true/false }` para consistencia con tu API actual
