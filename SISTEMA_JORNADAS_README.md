# Sistema de Gestión de Jornadas y Puntos ⚽🏆

## 📋 Descripción

Sistema completo para gestionar jornadas de Fantasy Football, calcular puntos de jugadores y equipos, y mostrar estadísticas detalladas.

## 🎯 Funcionalidades Implementadas

### 1. **Panel de Administrador** (`/admin/jornadas`)

El administrador puede:

- ✅ **Ver todas las jornadas** disponibles
- ✅ **Filtrar por temporada**
- ✅ **Ver configuración actual del sistema**
  - Jornada activa
  - Estado de modificaciones (habilitadas/bloqueadas)

#### Controles de Sistema:

1. **Establecer Jornada Activa**
   - Endpoint: `POST /admin/set-jornada-activa`
   - Activa una jornada específica para que los usuarios puedan participar

2. **Habilitar/Deshabilitar Modificaciones**
   - Endpoints: 
     - `POST /admin/habilitar-modificaciones`
     - `POST /admin/deshabilitar-modificaciones`
   - Permite o bloquea que los usuarios modifiquen sus equipos

3. **Procesar Jornada**
   - Endpoint: `POST /admin/jornadas/:id/procesar`
   - Calcula los puntos de todos los equipos para una jornada
   - Opción de activar la jornada automáticamente

4. **Recalcular Puntajes**
   - Endpoint: `POST /admin/jornadas/:id/recalcular`
   - Recalcula los puntos sin llamar a APIs externas

5. **Actualizar Estadísticas**
   - Endpoint: `POST /estadisticas/jornadas/:id/actualizar`
   - Actualiza las estadísticas de los jugadores para una jornada

### 2. **Vista de Jornadas para Usuarios** (`/jornadas`)

Los usuarios pueden:

- ✅ **Ver todas las jornadas** disponibles
- ✅ **Ver su rendimiento global**:
  - Puntos totales acumulados
  - Número de jornadas jugadas
  - Promedio de puntos por jornada
- ✅ **Identificar jornadas activas** visualmente
- ✅ **Ver puntos obtenidos** en cada jornada
- ✅ **Filtrar por temporada**
- ✅ **Ver detalle de cada jornada**

### 3. **Detalle de Equipo por Jornada** (`/jornadas/:id/mi-equipo`)

Muestra información detallada:

- ✅ **Puntaje total del equipo** en esa jornada
- ✅ **Lista de jugadores con sus puntos individuales**
  - Ordenados por puntos de mayor a menor
  - Nombre del jugador
  - Puntos obtenidos
- ✅ **Estadísticas de la jornada**
  - Promedio de puntos por jugador
  - Total de jugadores
- ✅ **Información de fechas** de la jornada

### 4. **Widget de Puntos en Dashboard** (`LoggedMenu`)

- ✅ **Resumen compacto** de puntos visible en el menú principal
- ✅ **Actualización automática** al cargar la página
- ✅ **Muestra**:
  - Puntos totales
  - Jornadas jugadas
  - Promedio por jornada

### 5. **Detalle de Jornada (Admin)** (`/admin/jornadas/:id/detalle`)

Vista detallada para administradores:

- ✅ **Estado completo de la jornada**
  - Activa/Inactiva
  - Modificaciones permitidas/bloqueadas
  - Puntos calculados/pendientes
- ✅ **Tabla completa de puntajes** de todos los jugadores
  - Puntos
  - Goles
  - Asistencias
  - Minutos jugados
  - Tarjetas amarillas/rojas
- ✅ **Ordenamiento por puntos**
- ✅ **Información de fechas**

## 🗂️ Estructura de Archivos Creados

```
src/
├── services/
│   └── jornadasService.ts          # Servicio con todos los endpoints
├── components/
│   ├── common/
│   │   └── WidgetPuntos.tsx        # Widget de puntos para el dashboard
│   └── pages/
│       ├── admin/
│       │   └── GestionJornadasAdmin.tsx  # Panel admin de jornadas
│       └── jornadas/
│           ├── JornadasUsuario.tsx       # Lista de jornadas del usuario
│           ├── MiEquipoJornada.tsx       # Detalle de equipo en jornada
│           ├── DetalleJornada.tsx        # Detalle admin de jornada
│           └── index.ts                   # Exportaciones
```

## 🔌 Endpoints Utilizados

### Jornadas

- `GET /jornadas` - Obtener todas las jornadas
- `GET /jornadas?temporada=2021` - Filtrar por temporada
- `GET /jornadas/:id` - Obtener jornada específica

### Administración

- `GET /admin/config` - Ver configuración actual
- `POST /admin/set-jornada-activa` - Establecer jornada activa
- `POST /admin/deshabilitar-modificaciones` - Bloquear equipos
- `POST /admin/habilitar-modificaciones` - Permitir cambios
- `POST /admin/jornadas/:id/procesar` - Procesar jornada
- `POST /admin/jornadas/:id/recalcular` - Recalcular puntajes

### Estadísticas

- `POST /estadisticas/jornadas/:id/actualizar` - Actualizar estadísticas
- `GET /estadisticas/jornadas/:id/puntajes` - Obtener puntajes
- `GET /estadisticas/jornadas/:id/jugadores/:jugadorId` - Puntaje de jugador

### Equipos

- `GET /equipos/:id/historial` - Historial de jornadas del equipo
- `GET /equipos/:id/jornadas/:jornadaId` - Puntuaciones en jornada específica

## 🎨 Características UI/UX

### Diseño Visual

- ✅ **Diseño responsive** adaptado a todos los dispositivos
- ✅ **Gradientes y efectos glass-morphism**
- ✅ **Animaciones suaves** en interacciones
- ✅ **Indicadores visuales** de estado (activo, procesado, etc.)
- ✅ **Badges y etiquetas** para información rápida
- ✅ **Hover effects** en tarjetas interactivas

### Feedback al Usuario

- ✅ **Notificaciones de éxito/error**
- ✅ **Confirmaciones** antes de acciones críticas
- ✅ **Loading states** durante peticiones
- ✅ **Estados vacíos** informativos
- ✅ **Mensajes descriptivos** de error

## 🚀 Rutas Disponibles

### Usuarios Autenticados

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/jornadas` | `JornadasUsuario` | Lista de todas las jornadas con puntos |
| `/jornadas/:id/mi-equipo` | `MiEquipoJornada` | Detalle de puntos del equipo en una jornada |

### Administradores

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin/jornadas` | `GestionJornadasAdmin` | Panel de control de jornadas |
| `/admin/jornadas/:id/detalle` | `DetalleJornada` | Vista detallada de una jornada |

## 📊 Interfaces y Tipos

```typescript
interface Jornada {
  id: number;
  numero: number;
  temporada?: string;
  activa?: boolean;
  permitirModificaciones?: boolean;
  fechaInicio?: string;
  fechaFin?: string;
  puntosCalculados?: boolean;
}

interface ConfiguracionSistema {
  jornadaActiva: number | null;
  modificacionesHabilitadas: boolean;
}

interface EstadisticaJugador {
  jugadorId: number;
  jornadaId: number;
  puntos: number;
  goles?: number;
  asistencias?: number;
  minutosJugados?: number;
  tarjetasAmarillas?: number;
  tarjetasRojas?: number;
}

interface PuntajeEquipo {
  equipoId: number;
  jornadaId: number;
  puntajeTotal: number;
  jugadores: {
    jugadorId: number;
    nombre: string;
    puntos: number;
  }[];
}

interface HistorialEquipo {
  jornadas: {
    jornadaId: number;
    numero: number;
    puntajeTotal: number;
  }[];
}
```

## 🔄 Flujo de Trabajo Típico

### Para Administradores:

1. **Configurar nueva jornada**
   - Habilitar modificaciones
   - Establecer como jornada activa
   
2. **Los usuarios configuran sus equipos**
   
3. **Bloquear modificaciones** cuando comience la jornada
   
4. **Actualizar estadísticas** después de los partidos
   
5. **Procesar jornada** para calcular puntos
   
6. **Revisar resultados** en la vista de detalle

### Para Usuarios:

1. **Configurar equipo** cuando las modificaciones estén habilitadas
   
2. **Ver jornadas activas** y próximas
   
3. **Consultar puntos** después del procesamiento
   
4. **Revisar detalle** de rendimiento por jornada
   
5. **Ver historial** completo de participación

## 🎯 Próximas Mejoras Sugeridas

- [ ] Gráficos de evolución de puntos
- [ ] Rankings entre usuarios
- [ ] Notificaciones push para jornadas activas
- [ ] Comparación de equipos
- [ ] Estadísticas avanzadas de jugadores
- [ ] Exportar historial a PDF/CSV
- [ ] Sistema de logros y badges
- [ ] Predicciones y apuestas de puntos

## 🛠️ Tecnologías Utilizadas

- **React** con TypeScript
- **React Router** para navegación
- **Axios** para peticiones HTTP
- **Tailwind CSS** para estilos
- **Vite** como bundler

## 📝 Notas Importantes

1. Todas las rutas están protegidas con `ProtectedRoute`
2. Los endpoints del backend deben estar corriendo en `http://localhost:3000`
3. El sistema usa autenticación por cookies (`withCredentials: true`)
4. Los errores se manejan con notificaciones visuales
5. El widget de puntos se actualiza automáticamente al cargar el dashboard

---

**Desarrollado para TurboFantasy** 🏆⚽
