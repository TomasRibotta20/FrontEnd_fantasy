# Endpoints del Backend para Gestión de Jornadas

Este documento describe los endpoints que deben ser implementados en el backend para soportar la funcionalidad de gestión de jornadas.

## 📋 Modelo de Datos Sugerido

```typescript
interface Jornada {
  id: number;
  numero: number; // Número de la jornada (1, 2, 3, etc.)
  activa: boolean; // Si esta jornada está actualmente activa
  permitirModificaciones: boolean; // Si los usuarios pueden modificar sus equipos
  fechaInicio: Date; // Fecha de inicio de la jornada
  fechaFin: Date; // Fecha de fin de la jornada
  puntosCalculados: boolean; // Si los puntos ya fueron calculados
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔌 Endpoints Requeridos

### 1. Obtener todas las jornadas

```
GET /api/jornadas
```

**Respuesta:**

```json
{
  "data": [
    {
      "id": 1,
      "numero": 1,
      "activa": true,
      "permitirModificaciones": true,
      "fechaInicio": "2024-01-01T00:00:00Z",
      "fechaFin": "2024-01-07T23:59:59Z",
      "puntosCalculados": false
    }
  ]
}
```

### 2. Crear una nueva jornada

```
POST /api/jornadas
```

**Body:**

```json
{
  "numero": 3
}
```

**Respuesta:**

```json
{
  "message": "Jornada creada exitosamente",
  "data": {
    "id": 3,
    "numero": 3,
    "activa": false,
    "permitirModificaciones": false,
    "puntosCalculados": false
  }
}
```

### 3. Activar una jornada específica

```
PATCH /api/jornadas/:id/activar
```

**Descripción:** Marca esta jornada como activa y desactiva todas las demás. Solo puede haber una jornada activa a la vez.

**Respuesta:**

```json
{
  "message": "Jornada activada exitosamente",
  "data": {
    "id": 2,
    "numero": 2,
    "activa": true
  }
}
```

### 4. Habilitar/Bloquear modificaciones

```
PATCH /api/jornadas/:id/modificaciones
```

**Body:**

```json
{
  "permitirModificaciones": false
}
```

**Descripción:** Controla si los usuarios pueden modificar sus equipos durante esta jornada.

**Respuesta:**

```json
{
  "message": "Permisos de modificación actualizados",
  "data": {
    "id": 1,
    "permitirModificaciones": false
  }
}
```

### 5. Calcular puntos de la jornada

```
POST /api/jornadas/:id/calcular-puntos
```

**Descripción:**

- Obtiene los datos de los partidos de la jornada desde la API externa (Football API)
- Calcula los puntos de cada jugador según su rendimiento
- Actualiza los puntos de cada equipo fantasy
- Marca la jornada como `puntosCalculados: true`

**Respuesta:**

```json
{
  "message": "Puntos calculados exitosamente",
  "data": {
    "jornadaId": 1,
    "totalEquipos": 150,
    "puntosActualizados": 1650,
    "puntosCalculados": true
  }
}
```

**Lógica sugerida:**

1. Obtener todos los partidos de la jornada
2. Para cada jugador que participó:
   - Goles: +6 puntos (delanteros), +5 (mediocampistas), +6 (defensores)
   - Asistencias: +4 puntos
   - Tarjeta amarilla: -1 punto
   - Tarjeta roja: -3 puntos
   - Portero (gol recibido): -1 punto
   - Portero (partido sin goles): +5 puntos
   - Minutos jugados: +2 puntos (si >60 min)
3. Sumar puntos a cada equipo fantasy según sus jugadores titulares

### 6. Avanzar a la siguiente jornada

```
POST /api/jornadas/avanzar
```

**Descripción:**

- Valida que la jornada actual tenga los puntos calculados
- Desactiva la jornada actual
- Crea o activa la siguiente jornada
- Habilita las modificaciones para la nueva jornada

**Respuesta:**

```json
{
  "message": "Se avanzó a la siguiente jornada exitosamente",
  "data": {
    "jornadaAnterior": {
      "id": 1,
      "numero": 1,
      "activa": false
    },
    "jornadaNueva": {
      "id": 2,
      "numero": 2,
      "activa": true,
      "permitirModificaciones": true
    }
  }
}
```

## 🔒 Consideraciones de Seguridad

1. Todos estos endpoints deben ser accesibles **solo por administradores**
2. Validar que solo exista una jornada activa a la vez
3. No permitir calcular puntos dos veces para la misma jornada
4. No permitir avanzar sin haber calculado los puntos
5. Implementar logs de auditoría para todas las acciones administrativas

## 📊 Validaciones Recomendadas

### Al bloquear modificaciones:

- Notificar a los usuarios que no podrán modificar sus equipos
- Puede ser programado automáticamente antes del inicio de los partidos

### Al calcular puntos:

- Verificar que todos los partidos de la jornada hayan finalizado
- Manejar casos donde falten datos de la API externa
- Implementar reintentos en caso de fallo

### Al avanzar jornada:

- Verificar que `puntosCalculados === true`
- Verificar que exista una siguiente jornada o crearla automáticamente

## 🔗 Integración con Modificación de Equipos

El endpoint de modificación de equipos debe verificar:

```typescript
// Antes de permitir modificaciones
const jornadaActual = await getJornadaActiva();

if (!jornadaActual.permitirModificaciones) {
  throw new Error('No se permiten modificaciones en la jornada actual');
}
```

## 📅 Automatización Sugerida (Opcional)

Puedes implementar tareas programadas (cron jobs) para:

1. **Bloquear modificaciones automáticamente:**

   - 1 hora antes del primer partido de la jornada

2. **Calcular puntos automáticamente:**

   - 2 horas después del último partido de la jornada

3. **Recordatorios a usuarios:**
   - 24 horas antes del cierre de modificaciones

Ejemplo con node-cron:

```typescript
import cron from 'node-cron';

// Ejecutar cada día a las 9 AM
cron.schedule('0 9 * * *', async () => {
  const jornadaActual = await getJornadaActiva();
  const horasCierreModificaciones =
    calcularHorasCierreModificaciones(jornadaActual);

  if (horasCierreModificaciones === 1) {
    await bloquearModificaciones(jornadaActual.id);
    await enviarNotificacionesUsuarios();
  }
});
```

## 🎯 Flujo Completo de una Jornada

1. ✅ **Crear Jornada** → Estado: Inactiva
2. ✅ **Activar Jornada** → Estado: Activa, Modificaciones: Habilitadas
3. 👥 **Usuarios modifican equipos**
4. 🔒 **Bloquear Modificaciones** → Antes de los partidos
5. ⚽ **Se juegan los partidos** (externo)
6. 📊 **Calcular Puntos** → Después de los partidos
7. ⏭️ **Avanzar Jornada** → Crear/Activar siguiente jornada

---

**Nota:** Este archivo es solo una guía. Los nombres de rutas y estructuras de datos pueden ajustarse según las convenciones del proyecto.
