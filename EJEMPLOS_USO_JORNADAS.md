# Ejemplos de Uso - Sistema de Jornadas

## 🚀 Cómo Usar el Sistema

### 1. Acceso como Usuario Regular

#### Ver mis jornadas y puntos
```
1. Login en la aplicación
2. En el menú principal, hacer clic en "Jornadas y Puntos" 🏆
3. Ver el resumen de tu rendimiento (total, jornadas, promedio)
4. Hacer clic en cualquier jornada para ver el detalle
```

#### Ver detalle de puntos en una jornada
```
1. Desde /jornadas, hacer clic en "Ver Detalle →"
2. Ver el puntaje total de tu equipo
3. Ver la lista de jugadores con sus puntos individuales
4. Verificar si la jornada está activa o procesada
```

#### Widget de puntos en dashboard
```
1. El widget se muestra automáticamente en LoggedMenu
2. Muestra siempre tus estadísticas actualizadas
3. No requiere interacción adicional
```

---

### 2. Acceso como Administrador

#### Establecer una jornada activa

**Paso a paso:**
```
1. Ir a /admin/jornadas
2. En "Establecer Jornada Activa"
3. Ingresar el ID de la jornada (ej: "1")
4. Hacer clic en "Activar"
5. ✅ Se mostrará confirmación de éxito
```

**Resultado esperado:**
- La jornada queda marcada como activa
- Los usuarios pueden ver que es la jornada actual
- Se actualiza la configuración del sistema

---

#### Bloquear modificaciones de equipos

**Paso a paso:**
```
1. Ir a /admin/jornadas
2. En "Control de Modificaciones"
3. Hacer clic en "🔒 Bloquear"
4. ✅ Confirmación: "Modificaciones deshabilitadas"
```

**Resultado esperado:**
- Los usuarios no pueden modificar sus equipos
- El estado cambia a "🔴 Bloqueadas" en la configuración

---

#### Habilitar modificaciones de equipos

**Paso a paso:**
```
1. Ir a /admin/jornadas
2. En "Control de Modificaciones"
3. Hacer clic en "✓ Habilitar"
4. ✅ Confirmación: "Modificaciones habilitadas"
```

**Resultado esperado:**
- Los usuarios pueden modificar sus equipos
- El estado cambia a "🟢 Habilitadas"

---

#### Procesar una jornada

**Paso a paso:**
```
1. Ir a /admin/jornadas
2. Buscar la jornada deseada
3. Hacer clic en "⚡ Procesar"
4. Confirmar la acción en el diálogo
5. ✅ Confirmación: "Jornada X procesada correctamente"
```

**Resultado esperado:**
- Se calculan los puntos de todos los equipos
- La jornada queda marcada como procesada
- Los usuarios pueden ver sus puntos

---

#### Recalcular puntajes

**Paso a paso:**
```
1. Ir a /admin/jornadas
2. Buscar la jornada deseada
3. Hacer clic en "🔄 Recalcular"
4. Confirmar la acción
5. ✅ Confirmación: "Puntajes recalculados"
```

**Resultado esperado:**
- Se recalculan los puntos sin llamar a APIs externas
- Útil para correcciones o ajustes

---

#### Actualizar estadísticas de una jornada

**Paso a paso:**
```
1. Ir a /admin/jornadas
2. Buscar la jornada deseada
3. Hacer clic en "📊 Actualizar Stats"
4. Confirmar la acción
5. ✅ Confirmación: "Estadísticas actualizadas"
```

**Resultado esperado:**
- Se actualizan las estadísticas de los jugadores
- Se consultan las APIs externas si es necesario

---

#### Ver detalle completo de una jornada

**Paso a paso:**
```
1. Ir a /admin/jornadas
2. Buscar la jornada deseada
3. Hacer clic en "👁️ Ver Detalle"
4. Se abre en nueva pestaña la vista detallada
```

**Información mostrada:**
- Estado completo de la jornada
- Tabla con todos los puntajes de jugadores
- Estadísticas individuales (goles, asistencias, etc.)
- Fechas de inicio y fin

---

### 3. Flujo Completo de una Jornada

#### Configuración Inicial (Admin)

```
1. Crear/verificar que existe la jornada en el sistema
2. Habilitar modificaciones (✓ Habilitar)
3. Establecer como jornada activa (Establecer ID)
```

#### Período de Configuración (Usuarios)

```
1. Los usuarios modifican sus equipos
2. Ajustan titulares y suplentes
3. Confirman sus alineaciones
```

#### Inicio de Jornada (Admin)

```
1. Bloquear modificaciones (🔒 Bloquear)
2. Verificar que usuarios ya no pueden cambiar equipos
```

#### Durante los Partidos

```
1. Los partidos se juegan
2. Las estadísticas se generan en el backend
```

#### Después de los Partidos (Admin)

```
1. Actualizar estadísticas (📊 Actualizar Stats)
2. Procesar jornada (⚡ Procesar)
3. Verificar puntos en detalle (👁️ Ver Detalle)
```

#### Consulta de Resultados (Usuarios)

```
1. Ver jornadas (/jornadas)
2. Ver puntos obtenidos en cada jornada
3. Revisar detalle de jugadores y puntos
```

---

## 🔍 Casos de Uso Específicos

### Caso 1: Corregir puntos de una jornada

**Escenario:** Los puntos se calcularon incorrectamente

**Solución:**
```
1. Ir a /admin/jornadas
2. Hacer clic en "🔄 Recalcular" en la jornada afectada
3. Verificar en "👁️ Ver Detalle" que los puntos son correctos
```

---

### Caso 2: Ver ranking de jugadores en una jornada

**Escenario:** Quiero ver qué jugadores puntuaron más

**Solución:**
```
1. Ir a /admin/jornadas/:id/detalle
2. Ver tabla ordenada por puntos (de mayor a menor)
3. Revisar estadísticas individuales
```

---

### Caso 3: Verificar participación de un usuario

**Escenario:** Un usuario reporta que no aparecen sus puntos

**Solución:**
```
1. Verificar que la jornada esté procesada (✓ PROCESADA)
2. Verificar que el usuario tenía equipo configurado
3. Ver detalle de la jornada para confirmar puntos
```

---

### Caso 4: Filtrar jornadas por temporada

**Escenario:** Quiero ver solo las jornadas de 2021

**Solución:**
```
1. Ir a /admin/jornadas o /jornadas
2. En el input de filtro, escribir "2021"
3. Hacer clic en "🔄 Recargar"
4. Se mostrarán solo jornadas de esa temporada
```

---

## 🎯 Tips y Mejores Prácticas

### Para Administradores

1. **Siempre bloquear antes de procesar**
   - Evita que usuarios modifiquen equipos durante el cálculo

2. **Verificar fecha actual vs fecha de jornada**
   - No procesar jornadas que aún no han terminado

3. **Usar recalcular solo cuando necesario**
   - Es más rápido pero no actualiza desde APIs externas

4. **Revisar detalle antes de comunicar**
   - Verificar que todos los puntos sean correctos

5. **Mantener una sola jornada activa**
   - Evita confusión entre usuarios

### Para Usuarios

1. **Configurar equipo temprano**
   - No esperar al último momento antes del bloqueo

2. **Verificar jornada activa**
   - Asegurarse de modificar el equipo correcto

3. **Revisar puntos regularmente**
   - Ver el widget de puntos en el dashboard

4. **Consultar historial**
   - Ver tendencia de rendimiento a lo largo de la temporada

---

## 🐛 Solución de Problemas Comunes

### "No puedo modificar mi equipo"

**Causa:** Las modificaciones están bloqueadas

**Solución:**
- Verificar en /admin/jornadas si está "🔴 Bloqueadas"
- Esperar a que admin habilite modificaciones
- O esperar a la siguiente jornada

---

### "No veo puntos en una jornada"

**Causa:** La jornada no ha sido procesada

**Solución:**
- Verificar si tiene badge "✓ PROCESADA"
- Si no, esperar a que admin procese
- Si sí pero no hay puntos, contactar admin

---

### "Los puntos parecen incorrectos"

**Causa:** Error en cálculo o estadísticas

**Solución:**
- Reportar al admin
- Admin debe usar "🔄 Recalcular"
- Si persiste, usar "📊 Actualizar Stats" y luego "⚡ Procesar"

---

### "Error al cargar jornadas"

**Causa:** Backend no responde o no hay conexión

**Solución:**
- Verificar que backend esté corriendo en localhost:3000
- Hacer clic en "🔄 Recargar"
- Revisar consola del navegador para más detalles

---

## 📞 Endpoints y Respuestas

### Obtener configuración actual

**Request:**
```
GET /admin/config
```

**Response:**
```json
{
  "jornadaActiva": 2,
  "modificacionesHabilitadas": true
}
```

---

### Obtener historial de equipo

**Request:**
```
GET /equipos/1/historial
```

**Response:**
```json
{
  "jornadas": [
    {
      "jornadaId": 1,
      "numero": 1,
      "puntajeTotal": 35
    },
    {
      "jornadaId": 2,
      "numero": 2,
      "puntajeTotal": 42
    }
  ]
}
```

---

### Obtener puntos de equipo en jornada

**Request:**
```
GET /equipos/1/jornadas/2
```

**Response:**
```json
{
  "equipoId": 1,
  "jornadaId": 2,
  "puntajeTotal": 42,
  "jugadores": [
    {
      "jugadorId": 123,
      "nombre": "Lionel Messi",
      "puntos": 15
    },
    {
      "jugadorId": 456,
      "nombre": "Cristiano Ronaldo",
      "puntos": 12
    }
  ]
}
```

---

## 🎓 Glosario

- **Jornada**: Período de tiempo donde se juegan partidos y se calculan puntos
- **Jornada Activa**: La jornada actual en la que los usuarios pueden participar
- **Procesar**: Calcular los puntos de todos los equipos para una jornada
- **Recalcular**: Volver a calcular puntos sin consultar APIs externas
- **Modificaciones**: Capacidad de los usuarios de cambiar sus equipos
- **Bloquear**: Impedir que usuarios modifiquen equipos
- **Historial**: Registro de todas las jornadas en las que participó un equipo

---

**¡Sistema listo para usar!** 🚀⚽🏆
