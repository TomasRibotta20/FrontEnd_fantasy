import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  jornadasService,
  adminService,
  type Jornada,
  type ConfiguracionSistema,
} from '../../../services/jornadasService';
import EndpointNoDisponible from '../../common/EndpointNoDisponible';

const GestionJornadasAdmin = () => {
  const navigate = useNavigate();
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [config, setConfig] = useState<ConfiguracionSistema>({
    jornadaActiva: null,
    modificacionesHabilitadas: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTemporada, setSelectedTemporada] = useState<string>('');
  const [jornadaIdInput, setJornadaIdInput] = useState<string>('');
  const [endpointNoDisponible, setEndpointNoDisponible] = useState(false);

  // Debug: Verificar cambios en config
  useEffect(() => {
    console.log('[CONFIG] Actualizada:', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    loadJornadas();
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemporada]);

  const loadJornadas = async () => {
    try {
      setLoading(true);
      const data = await jornadasService.getJornadas(
        selectedTemporada || undefined
      );
      // Asegurarnos que data sea un array
      setJornadas(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error(err);
      // Establecer array vacío en caso de error
      setJornadas([]);
      // Si es un error 404 o 403, mostrar componente de endpoint no disponible
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status: number } };
        if (
          axiosError.response?.status === 404 ||
          axiosError.response?.status === 403
        ) {
          setEndpointNoDisponible(true);
          return;
        }
      }
      setError('Error al cargar las jornadas');
    } finally {
      setLoading(false);
    }
  };

  // Si el endpoint no está disponible, mostrar componente especial
  if (endpointNoDisponible) {
    return (
      <EndpointNoDisponible mensaje="Los endpoints de jornadas aún no están implementados en el backend" />
    );
  }

  const loadConfig = async () => {
    try {
      console.log('[CONFIG] Cargando configuración del servidor...');
      const data = await adminService.getConfig();

      // Verificar si recibimos datos válidos
      if (data && typeof data === 'object') {
        console.log('[CONFIG] Configuración recibida del servidor');

        // Extraer jornadaActiva - puede venir como número o como objeto con id
        let jornadaActivaId: number | null = null;
        if (data.jornadaActiva !== undefined && data.jornadaActiva !== null) {
          if (
            typeof data.jornadaActiva === 'object' &&
            'id' in data.jornadaActiva
          ) {
            // Si es un objeto, extraer el id
            jornadaActivaId = (data.jornadaActiva as { id: number }).id;
          } else if (typeof data.jornadaActiva === 'number') {
            // Si es un número, usarlo directamente
            jornadaActivaId = data.jornadaActiva;
          } else if (typeof data.jornadaActiva === 'string') {
            // Si es un string, convertir a número
            jornadaActivaId = parseInt(data.jornadaActiva);
          }
        }

        // Actualizar con los datos del servidor
        const newConfig: ConfiguracionSistema = {
          jornadaActiva: jornadaActivaId,
          modificacionesHabilitadas:
            data.modificacionesHabilitadas !== undefined
              ? data.modificacionesHabilitadas
              : false,
        };

        console.log(
          '[CONFIG] Actualizada: jornadaActiva=' +
            newConfig.jornadaActiva +
            ', modificaciones=' +
            newConfig.modificacionesHabilitadas
        );
        setConfig(newConfig);
      } else {
        console.warn('[CONFIG] Datos de configuración inválidos');
      }
    } catch (err) {
      const statusCode = (err as { response?: { status: number } })?.response
        ?.status;

      if (statusCode === 404) {
        console.warn(
          '[CONFIG] Endpoint /api/admin/config no existe - el backend debe implementarlo'
        );
      } else if (statusCode === 401 || statusCode === 403) {
        console.warn('[CONFIG] Sin autorización para obtener configuración');
      } else {
        console.error('[CONFIG] Error al cargar configuración:', err);
      }

      // Mantener valores por defecto si no podemos cargar del servidor
      console.log('[CONFIG] Usando configuración por defecto');
    }
  };

  const handleSetJornadaActiva = async () => {
    if (!jornadaIdInput) {
      setError('Por favor ingresa un ID de jornada');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const jornadaIdNum = parseInt(jornadaIdInput);

      // Actualizar UI optimísticamente
      console.log(
        '[JORNADA] Actualizando config con jornadaActiva: ' + jornadaIdNum
      );
      const newConfig: ConfiguracionSistema = {
        jornadaActiva: jornadaIdNum,
        modificacionesHabilitadas: config.modificacionesHabilitadas,
      };
      setConfig(newConfig);

      // ESPERAR la respuesta del servidor para confirmar
      await adminService.setJornadaActiva(jornadaIdInput);
      console.log('[JORNADA] Jornada activa establecida en el servidor');

      setSuccess(`Jornada ${jornadaIdInput} establecida como activa`);
      setJornadaIdInput('');

      // Recargar jornadas para ver el cambio del flag "activa"
      await loadJornadas();

      // Auto-ocultar mensaje después de 5 segundos
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('[JORNADA] Error al establecer jornada activa:', err);
      setError(`Error al establecer jornada ${jornadaIdInput} como activa`);

      // Revertir cambio local si falló en el servidor
      setConfig({
        jornadaActiva: null,
        modificacionesHabilitadas: config.modificacionesHabilitadas,
      });

      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeshabilitarModificaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Actualizar UI optimísticamente
      console.log('[MODIFICACIONES] Bloqueando modificaciones...');
      const newConfig: ConfiguracionSistema = {
        jornadaActiva: config.jornadaActiva,
        modificacionesHabilitadas: false,
      };
      setConfig(newConfig);

      // ESPERAR la respuesta del servidor
      await adminService.deshabilitarModificaciones();
      console.log('[MODIFICACIONES] Modificaciones bloqueadas en el servidor');

      setSuccess(
        'Modificaciones BLOQUEADAS - Los usuarios no pueden cambiar sus equipos'
      );

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('[MODIFICACIONES] Error al bloquear modificaciones:', err);
      setError('Error al bloquear modificaciones');

      // Revertir cambio si falló
      setConfig({
        jornadaActiva: config.jornadaActiva,
        modificacionesHabilitadas: true,
      });

      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleHabilitarModificaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Actualizar UI optimísticamente
      console.log('[MODIFICACIONES] Habilitando modificaciones...');
      const newConfig: ConfiguracionSistema = {
        jornadaActiva: config.jornadaActiva,
        modificacionesHabilitadas: true,
      };
      setConfig(newConfig);

      // ESPERAR la respuesta del servidor
      await adminService.habilitarModificaciones();
      console.log('[MODIFICACIONES] Modificaciones habilitadas en el servidor');

      setSuccess(
        'Modificaciones HABILITADAS - Los usuarios pueden cambiar sus equipos'
      );

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('[MODIFICACIONES] Error al habilitar modificaciones:', err);
      setError('Error al habilitar modificaciones');

      // Revertir cambio si falló
      setConfig({
        jornadaActiva: config.jornadaActiva,
        modificacionesHabilitadas: false,
      });

      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pt-20 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Botón volver */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-lg text-white px-4 py-2 rounded-lg font-bold transition-all border-2 border-white/30 hover:border-white/50 drop-shadow-md"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver
          </button>
        </div>

        <h1 className="text-4xl font-bold text-white mb-8">
          Gestión de Jornadas - Admin
        </h1>

        {/* Guía Rápida */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg mb-6 border-2 border-white/30">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            Guía Rápida de Uso
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/10 p-3 rounded-lg">
              <p className="font-bold mb-1">1. Activar Jornada</p>
              <p className="text-xs">
                Selecciona una jornada y haz click en "Activar". Los usuarios
                podrán configurar sus equipos.
              </p>
            </div>
            <div className="bg-white/10 p-3 rounded-lg">
              <p className="font-bold mb-1">2. Gestionar Modificaciones</p>
              <p className="text-xs">
                Usa "Habilitar/Deshabilitar Modificaciones" para controlar si
                los usuarios pueden cambiar sus equipos.
              </p>
            </div>
            <div className="bg-white/10 p-3 rounded-lg">
              <p className="font-bold mb-1">3. Procesar Puntos</p>
              <p className="text-xs">
                Una vez finalizada la jornada, usa "Ver Detalle" → "Procesar
                Jornada" para calcular puntos.
              </p>
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        {error && (
          <div className="bg-red-600 text-white p-6 rounded-lg mb-6 flex items-center justify-between shadow-2xl border-2 border-red-400 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-2xl hover:bg-red-700 px-3 py-1 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-600 text-white p-6 rounded-lg mb-6 flex items-center justify-between shadow-2xl border-2 border-green-400 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">{success}</span>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-2xl hover:bg-green-700 px-3 py-1 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Configuración Actual */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 mb-8 border-2 border-white/30 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            Configuración Actual del Sistema
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-lg border-2 border-white/30">
              <p className="text-white/80 text-sm mb-2 font-semibold">
                Jornada Activa
              </p>
              <div className="flex items-center gap-2">
                <p className="text-white text-4xl font-bold">
                  {config.jornadaActiva || 'Ninguna'}
                </p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-lg border-2 border-white/30">
              <p className="text-white/80 text-sm mb-2 font-semibold">
                Estado Modificaciones
              </p>
              <div className="flex items-center gap-3">
                <p
                  className={`text-3xl font-bold ${
                    config.modificacionesHabilitadas
                      ? 'text-green-300'
                      : 'text-red-300'
                  }`}
                >
                  {config.modificacionesHabilitadas
                    ? 'Habilitadas'
                    : 'Bloqueadas'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controles de Administración */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            Controles de Sistema
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Establecer Jornada Activa */}
            <div className="bg-black/30 p-4 rounded-lg">
              <label className="block text-white mb-2 font-semibold">
                Establecer Jornada Activa
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={jornadaIdInput}
                  onChange={(e) => setJornadaIdInput(e.target.value)}
                  placeholder="ID de Jornada"
                  className="flex-1 px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400"
                />
                <button
                  onClick={handleSetJornadaActiva}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {loading ? 'Activando...' : 'Activar'}
                </button>
              </div>
            </div>

            {/* Control de Modificaciones */}
            <div className="bg-black/30 p-4 rounded-lg">
              <label className="block text-white mb-2 font-semibold">
                Control de Modificaciones
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleHabilitarModificaciones}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Cargando...' : 'Habilitar'}
                </button>
                <button
                  onClick={handleDeshabilitarModificaciones}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Cargando...' : 'Bloquear'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={selectedTemporada}
              onChange={(e) => setSelectedTemporada(e.target.value)}
              placeholder="Filtrar por temporada (ej: 2021)"
              className="flex-1 px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400"
            />
            <button
              onClick={loadJornadas}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              Recargar
            </button>
          </div>
        </div>

        {/* Lista de Jornadas */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            Jornadas Disponibles
          </h2>

          {loading && jornadas.length === 0 ? (
            <div className="text-center text-white py-12">
              <div className="animate-spin text-6xl mb-4">⚪</div>
              <p>Cargando jornadas...</p>
            </div>
          ) : jornadas.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              No hay jornadas disponibles
            </div>
          ) : (
            <div className="space-y-4">
              {jornadas
                .sort((a, b) => a.id - b.id)
                .map((jornada) => (
                  <div
                    key={jornada.id}
                    className={`bg-black/30 rounded-lg p-6 border-2 ${
                      jornada.activa
                        ? 'border-green-500 shadow-lg shadow-green-500/50'
                        : 'border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-bold text-white">
                          {jornada.nombre ||
                            `Jornada ${jornada.numero || jornada.id}`}
                        </h3>
                        {jornada.activa && (
                          <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full">
                            ACTIVA
                          </span>
                        )}
                        {jornada.puntosCalculados && (
                          <span className="px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">
                            PROCESADA
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400">ID: {jornada.id}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {jornada.temporada && (
                        <p className="text-gray-300">
                          <span className="text-gray-400">Temporada:</span>{' '}
                          {String(jornada.temporada)}
                        </p>
                      )}
                      {jornada.etapa && (
                        <p className="text-gray-300">
                          <span className="text-gray-400">Etapa:</span>{' '}
                          {String(jornada.etapa)}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() =>
                          navigate(`/admin/jornadas/${jornada.id}/detalle`)
                        }
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold"
                      >
                        Ver Detalle
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestionJornadasAdmin;
