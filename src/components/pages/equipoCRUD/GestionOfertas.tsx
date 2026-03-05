import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ofertasService } from '../../../services/ofertasService';
import type { Oferta } from '../../../services/ofertasService';
import { Notification } from '../../common/Notification';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useTorneoSeleccionado } from '../../../hooks/useSessionData';

type TabType = 'enviadas' | 'recibidas';

/** Gestión de ofertas enviadas y recibidas. */
const GestionOfertas = () => {
  const navigate = useNavigate();
  const [torneoId] = useTorneoSeleccionado();
  const [activeTab, setActiveTab] = useState<TabType>('recibidas');
  const [ofertasEnviadas, setOfertasEnviadas] = useState<Oferta[]>([]);
  const [ofertasRecibidas, setOfertasRecibidas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  const cargarOfertas = useCallback(async () => {
    if (!torneoId) {
      setNotification({
        type: 'warning',
        text: 'Selecciona un torneo para ver las ofertas',
      });
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'enviadas') {
        const response = await ofertasService.obtenerMisOfertasEnviadas(
          parseInt(torneoId),
        );
        // El backend devuelve { ofertas: [], total, limit, offset }
        const ofertas =
          response.data?.ofertas || response.data?.data || response.data || [];

        setOfertasEnviadas(Array.isArray(ofertas) ? ofertas : []);
      } else {
        const response = await ofertasService.obtenerMisOfertasRecibidas(
          parseInt(torneoId),
        );
        // El backend devuelve { ofertas: [], total, limit, offset }
        const ofertas =
          response.data?.ofertas || response.data?.data || response.data || [];

        setOfertasRecibidas(Array.isArray(ofertas) ? ofertas : []);
      }
    } catch {
      setNotification({
        type: 'error',
        text: 'Error al cargar las ofertas',
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, torneoId]);

  useEffect(() => {
    cargarOfertas();
  }, [cargarOfertas]);

  const handleAceptarOferta = async (ofertaId: number) => {
    try {
      await ofertasService.aceptarOferta(ofertaId);
      setNotification({
        type: 'success',
        text: 'Oferta aceptada correctamente',
      });
      cargarOfertas();
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      let errorMsg =
        axiosError.response?.data?.message || 'Error al aceptar la oferta';

      // Si el error es de presupuesto, agregar contexto
      if (errorMsg.includes('presupuesto suficiente')) {
        errorMsg +=
          ' (Nota: Este puede ser un error del backend - el dinero ya debería estar bloqueado)';
      }

      setNotification({
        type: 'error',
        text: errorMsg,
      });
    }
  };

  const handleRechazarOferta = async (ofertaId: number) => {
    try {
      await ofertasService.rechazarOferta(ofertaId);
      setNotification({
        type: 'success',
        text: 'Oferta rechazada',
      });
      cargarOfertas();
    } catch {
      setNotification({
        type: 'error',
        text: 'Error al rechazar la oferta',
      });
    }
  };

  const handleCancelarOferta = async (ofertaId: number) => {
    try {
      await ofertasService.cancelarOferta(ofertaId);
      setNotification({
        type: 'success',
        text: 'Oferta cancelada',
      });
      cargarOfertas();
    } catch {
      setNotification({
        type: 'error',
        text: 'Error al cancelar la oferta',
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    const styles = {
      PENDIENTE: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      ACEPTADA: 'bg-green-500/20 text-green-300 border-green-500/50',
      RECHAZADA: 'bg-red-500/20 text-red-300 border-red-500/50',
    };
    return styles[estado as keyof typeof styles] || styles.PENDIENTE;
  };

  const ofertas = activeTab === 'enviadas' ? ofertasEnviadas : ofertasRecibidas;

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{
          backgroundImage: `url('/Background_LandingPage.png')`,
          filter: 'blur(2px)',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-30"></div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/LoggedMenu')}
            className="backdrop-blur-lg bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 text-white border border-white/30 transition-all flex items-center gap-2"
          >
            <span>←</span>
            Volver
          </button>
          <h1 className="text-white text-3xl font-bold">Mis Ofertas</h1>
          <div className="w-24"></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('recibidas')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'recibidas'
                ? 'backdrop-blur-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'backdrop-blur-lg bg-white/10 text-white/70 hover:bg-white/20 border border-white/30'
            }`}
          >
            Ofertas Recibidas
          </button>
          <button
            onClick={() => setActiveTab('enviadas')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'enviadas'
                ? 'backdrop-blur-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'backdrop-blur-lg bg-white/10 text-white/70 hover:bg-white/20 border border-white/30'
            }`}
          >
            Ofertas Enviadas
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <LoadingSpinner variant="section" message="Cargando ofertas..." />
        )}

        {/* Lista de Ofertas */}
        {!loading && ofertas.length === 0 && (
          <div className="backdrop-blur-lg bg-white/10 rounded-xl border-2 border-white/40 p-12 text-center">
            <p className="text-white text-xl">
              No tienes ofertas{' '}
              {activeTab === 'enviadas' ? 'enviadas' : 'recibidas'}
            </p>
          </div>
        )}

        {!loading && ofertas.length > 0 && (
          <div className="grid gap-4">
            {ofertas.map((oferta) => {
              // Validar que existe la información necesaria
              if (!oferta.jugador) {
                return null;
              }

              return (
                <div
                  key={oferta.id}
                  className="backdrop-blur-lg bg-white/10 rounded-xl border-2 border-white/40 p-6 hover:bg-white/15 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Imagen del jugador */}
                    <img
                      src={
                        oferta.jugador?.foto ||
                        oferta.jugador?.photo ||
                        '/default-player.png'
                      }
                      alt={
                        oferta.jugador?.nombre ||
                        oferta.jugador?.name ||
                        'Jugador'
                      }
                      className="w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-lg"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/default-player.png';
                      }}
                    />

                    {/* Información del jugador y oferta */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white text-xl font-bold">
                            {oferta.jugador?.nombre ||
                              oferta.jugador?.name ||
                              'Jugador desconocido'}
                          </h3>
                          <p className="text-white/70 text-sm">
                            {oferta.jugador?.posicion ||
                              oferta.jugador?.position ||
                              'N/A'}{' '}
                            • {oferta.jugador?.club || 'N/A'}
                          </p>
                          {activeTab === 'recibidas' && oferta.oferente && (
                            <p className="text-white/60 text-xs mt-1">
                              Oferta de: {oferta.oferente.usuario} (
                              {oferta.oferente.nombre})
                            </p>
                          )}
                          {activeTab === 'enviadas' && oferta.vendedor && (
                            <p className="text-white/60 text-xs mt-1">
                              Propietario: {oferta.vendedor.usuario} (
                              {oferta.vendedor.nombre})
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoBadge(
                            oferta.estado,
                          )}`}
                        >
                          {oferta.estado}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="backdrop-blur-lg bg-white/5 rounded-lg p-3 border border-white/20">
                          <p className="text-white/70 text-xs mb-1">
                            Monto Ofertado
                          </p>
                          <p className="text-white text-lg font-bold">
                            $
                            {oferta.monto_ofertado.toLocaleString('es-AR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                        <div className="backdrop-blur-lg bg-white/5 rounded-lg p-3 border border-white/20">
                          <p className="text-white/70 text-xs mb-1">
                            Precio Actual
                          </p>
                          <p className="text-white text-lg font-bold">
                            $
                            {oferta.jugador?.precio_actual?.toLocaleString(
                              'es-AR',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            ) || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {oferta.horas_restantes !== undefined && (
                        <div className="backdrop-blur-lg bg-blue-500/10 rounded-lg p-2 border border-blue-500/30 mb-3">
                          <p className="text-blue-200 text-xs text-center">
                            Expira en {oferta.horas_restantes} horas
                          </p>
                        </div>
                      )}

                      {oferta.mensaje_oferente && (
                        <div className="backdrop-blur-lg bg-white/5 rounded-lg p-3 border border-white/20 mb-3">
                          <p className="text-white/70 text-xs mb-1">Mensaje</p>
                          <p className="text-white text-sm">
                            {oferta.mensaje_oferente}
                          </p>
                        </div>
                      )}

                      {/* Acciones según el estado y tipo de oferta */}
                      {oferta.estado === 'PENDIENTE' && (
                        <div className="flex gap-2">
                          {activeTab === 'recibidas' ? (
                            <>
                              <button
                                onClick={() => handleAceptarOferta(oferta.id)}
                                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold transition-all"
                              >
                                Aceptar
                              </button>
                              <button
                                onClick={() => handleRechazarOferta(oferta.id)}
                                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold transition-all"
                              >
                                Rechazar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleCancelarOferta(oferta.id)}
                              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold transition-all"
                            >
                              Cancelar Oferta
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notificación */}
      {notification && (
        <Notification
          message={notification}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default GestionOfertas;
