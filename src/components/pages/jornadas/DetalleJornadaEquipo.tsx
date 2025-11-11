import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormacionEquipoCompacta from '../../common/FormacionEquipoCompacta';

interface Estadisticas {
  minutos: number;
  rating: number;
  goles: number;
  asistencias: number;
  golesRecibidos: number;
  atajadas: number;
  tarjetasAmarillas: number;
  tarjetasRojas: number;
  porteriaCero: boolean;
}

interface Jugador {
  id: number;
  nombre: string;
  nombreCompleto?: string;
  posicion: string;
  club?: string;
  clubLogo?: string;
  foto?: string;
  esTitular: boolean;
  puntaje: number; // Backend usa "puntaje", no "puntos"
  estadisticas?: Estadisticas | null;
}

interface JornadaEquipo {
  equipo: {
    id: number;
    nombre: string;
    usuarioId?: {
      id: number;
    };
  };
  jornada: {
    id: number;
    nombre: string;
    temporada?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
  };
  puntajeTotal: number;
  fechaSnapshot?: string;
  jugadores: Jugador[];
}

const DetalleJornadaEquipo = () => {
  const { equipoId, jornadaId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<JornadaEquipo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:3000/api/equipos/${equipoId}/jornadas/${jornadaId}`,
          { credentials: 'include' }
        );

        if (!response.ok) {
          throw new Error('No se pudo obtener el detalle de la jornada');
        }

        const jsonData = await response.json();
        console.log('🔍 [DetalleJornadaEquipo] Respuesta completa:', jsonData);
        
        const extractedData = jsonData?.data || jsonData;
        console.log('🔍 [DetalleJornadaEquipo] Datos extraídos:', extractedData);
        console.log('🔍 [DetalleJornadaEquipo] Estructura de datos:');
        console.log('  - Equipo:', extractedData?.equipo);
        console.log('  - Jornada:', extractedData?.jornada);
        console.log('  - Jugadores (directos):', extractedData?.jugadores?.length || 0);
        console.log('  - Puntaje total:', extractedData?.puntajeTotal);
        
        setData(extractedData);
      } catch (err) {
        console.error('❌ Error al cargar detalle:', err);
        setError(
          err instanceof Error ? err.message : 'Error al cargar detalle'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [equipoId, jornadaId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pt-24 pb-8 px-8 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin text-6xl mb-4">⚽</div>
          <p className="text-xl">Cargando detalle...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pt-24 pb-8 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500 text-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p>{error || 'No se encontraron datos'}</p>
            <button
              onClick={() => navigate('/mis-puntos/historial')}
              className="mt-4 px-4 py-2 bg-white text-red-500 rounded-lg font-semibold"
            >
              Volver al Historial
            </button>
          </div>
        </div>
      </div>
    );
  }

  const jugadores = data.jugadores || [];
  const puntajeTotal = data.puntajeTotal || 0;
  
  console.log('📊 [Renderizando] Total de jugadores:', jugadores.length);
  console.log('📊 [Renderizando] Puntaje total:', puntajeTotal);
  
  // Calcular el total sumando los puntos de los jugadores como verificación
  const totalCalculado = jugadores.reduce((sum: number, j: Jugador) => sum + (j.puntaje || 0), 0);
  console.log('📊 [Renderizando] Total calculado sumando jugadores:', totalCalculado.toFixed(1));
  
  // Separar titulares y suplentes
  const titulares = jugadores.filter(j => j.esTitular);
  const suplentes = jugadores.filter(j => !j.esTitular);
  console.log('📊 [Renderizando] Titulares:', titulares.length, 'Suplentes:', suplentes.length);

  // Mapear jugadores al formato que espera FormacionEquipoCompacta
  const playersForFormacion = titulares.map((jugador) => ({
    id: jugador.id,
    apiId: jugador.id, // Usar id como apiId
    name: jugador.nombre,
    firstName: '',
    lastName: '',
    age: 25, // Valores por defecto
    nationality: '',
    photo: jugador.foto || 'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=⚽',
    jerseyNumber: 0,
    position: jugador.posicion,
    esTitular: jugador.esTitular,
    puntaje: jugador.puntaje, // ✅ IMPORTANTE: Pasar el puntaje
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 pt-24 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/mis-puntos/historial')}
            className="text-white hover:text-gray-300 mb-4 flex items-center gap-2"
          >
            ← Volver al Historial
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">
            {data.equipo?.nombre || 'Mi Equipo'}
          </h1>
        </div>

        {/* Panel de información de la jornada y formación */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Información de la jornada */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              📋 Información de Jornada
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm">Jornada</p>
                <p className="text-white text-lg font-semibold">
                  {data.jornada?.nombre || `Jornada ${data.jornada?.id}`}
                </p>
              </div>
              {data.jornada?.temporada && (
                <div>
                  <p className="text-gray-400 text-sm">Temporada</p>
                  <p className="text-white text-lg font-semibold">
                    {data.jornada.temporada}
                  </p>
                </div>
              )}
              {data.jornada?.fecha_inicio && (
                <div>
                  <p className="text-gray-400 text-sm">Fecha Inicio</p>
                  <p className="text-white text-lg font-semibold">
                    {new Date(data.jornada.fecha_inicio).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}
              {data.jornada?.fecha_fin && (
                <div>
                  <p className="text-gray-400 text-sm">Fecha Fin</p>
                  <p className="text-white text-lg font-semibold">
                    {new Date(data.jornada.fecha_fin).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}
              <div className="pt-4 border-t border-white/20">
                <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg p-4 shadow-lg">
                  <p className="text-white/80 text-sm mb-1">Puntos Totales</p>
                  <p className="text-white text-4xl font-bold">
                    {puntajeTotal.toFixed(1)}
                  </p>
                  {Math.abs(totalCalculado - puntajeTotal) > 0.1 && (
                    <p className="text-white/60 text-xs mt-1">
                      (Suma: {totalCalculado.toFixed(1)})
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Formación del equipo con puntajes */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              ⚽ Formación Titular
            </h2>
            {playersForFormacion.length > 0 ? (
              <FormacionEquipoCompacta
                players={playersForFormacion}
                showSuplentes={false}
                mostrarPuntajes={true}
              />
            ) : (
              <div className="text-center py-12 text-gray-400">
                No hay jugadores titulares
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas Globales del Equipo */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 mb-8 border-2 border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            📊 Estadísticas Globales
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4 text-center backdrop-blur-sm">
              <p className="text-white/80 text-sm mb-2">Titulares</p>
              <p className="text-white text-3xl font-bold">{titulares.length}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center backdrop-blur-sm">
              <p className="text-white/80 text-sm mb-2">Suplentes</p>
              <p className="text-white text-3xl font-bold">{suplentes.length}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center backdrop-blur-sm">
              <p className="text-white/80 text-sm mb-2">Promedio Puntos</p>
              <p className="text-white text-3xl font-bold">
                {jugadores.length > 0 ? (puntajeTotal / jugadores.length).toFixed(1) : '0.0'}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center backdrop-blur-sm">
              <p className="text-white/80 text-sm mb-2">Total Jugadores</p>
              <p className="text-white text-3xl font-bold">{jugadores.length}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center backdrop-blur-sm">
              <p className="text-white/80 text-sm mb-2">Total Goles</p>
              <p className="text-white text-3xl font-bold">
                {jugadores.reduce((sum, j) => sum + (j.estadisticas?.goles || 0), 0)}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center backdrop-blur-sm">
              <p className="text-white/80 text-sm mb-2">Total Asistencias</p>
              <p className="text-white text-3xl font-bold">
                {jugadores.reduce((sum, j) => sum + (j.estadisticas?.asistencias || 0), 0)}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center backdrop-blur-sm">
              <p className="text-white/80 text-sm mb-2">Tarjetas Amarillas</p>
              <p className="text-yellow-400 text-3xl font-bold">
                {jugadores.reduce((sum, j) => sum + (j.estadisticas?.tarjetasAmarillas || 0), 0)}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center backdrop-blur-sm">
              <p className="text-white/80 text-sm mb-2">Tarjetas Rojas</p>
              <p className="text-red-400 text-3xl font-bold">
                {jugadores.reduce((sum, j) => sum + (j.estadisticas?.tarjetasRojas || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabla de Titulares */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            ⭐ Titulares
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left text-white font-semibold py-3 px-4">
                    Jugador
                  </th>
                  <th className="text-left text-white font-semibold py-3 px-4">
                    Posición
                  </th>
                  <th className="text-left text-white font-semibold py-3 px-4">
                    Club
                  </th>
                  <th className="text-center text-white font-semibold py-3 px-4">
                    Min
                  </th>
                  <th className="text-center text-white font-semibold py-3 px-4">
                    Rating
                  </th>
                  <th className="text-center text-white font-semibold py-3 px-4">
                    Puntos
                  </th>
                </tr>
              </thead>
              <tbody>
                {titulares.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-8">
                      No hay titulares en este equipo
                    </td>
                  </tr>
                ) : (
                  titulares.map((jugador: Jugador) => (
                    <tr
                      key={jugador.id}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {jugador.foto && (
                            <img
                              src={jugador.foto}
                              alt={jugador.nombre}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <p className="text-white font-medium">{jugador.nombre}</p>
                            {jugador.nombreCompleto && jugador.nombreCompleto !== jugador.nombre && (
                              <p className="text-gray-400 text-xs">{jugador.nombreCompleto}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {jugador.posicion}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {jugador.clubLogo && (
                            <img
                              src={jugador.clubLogo}
                              alt={jugador.club}
                              className="w-5 h-5 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span className="text-gray-300 text-sm">{jugador.club}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-300">
                        {jugador.estadisticas?.minutos || 0}'
                      </td>
                      <td className="py-3 px-4 text-center text-gray-300">
                        {jugador.estadisticas?.rating ? jugador.estadisticas.rating.toFixed(1) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 font-bold rounded-lg ${
                          (jugador.puntaje ?? 0) > 0 
                            ? 'bg-yellow-500 text-black' 
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {(jugador.puntaje ?? 0).toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla de Suplentes */}
        {suplentes.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">
              🔄 Suplentes
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left text-white font-semibold py-3 px-4">
                      Jugador
                    </th>
                    <th className="text-left text-white font-semibold py-3 px-4">
                      Posición
                    </th>
                    <th className="text-left text-white font-semibold py-3 px-4">
                      Club
                    </th>
                    <th className="text-center text-white font-semibold py-3 px-4">
                      Min
                    </th>
                    <th className="text-center text-white font-semibold py-3 px-4">
                      Rating
                    </th>
                    <th className="text-center text-white font-semibold py-3 px-4">
                      Puntos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {suplentes.map((jugador: Jugador) => (
                    <tr
                      key={jugador.id}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {jugador.foto && (
                            <img
                              src={jugador.foto}
                              alt={jugador.nombre}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <p className="text-white font-medium">{jugador.nombre}</p>
                            {jugador.nombreCompleto && jugador.nombreCompleto !== jugador.nombre && (
                              <p className="text-gray-400 text-xs">{jugador.nombreCompleto}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {jugador.posicion}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {jugador.clubLogo && (
                            <img
                              src={jugador.clubLogo}
                              alt={jugador.club}
                              className="w-5 h-5 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span className="text-gray-300 text-sm">{jugador.club}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-300">
                        {jugador.estadisticas?.minutos || 0}'
                      </td>
                      <td className="py-3 px-4 text-center text-gray-300">
                        {jugador.estadisticas?.rating ? jugador.estadisticas.rating.toFixed(1) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 font-bold rounded-lg ${
                          (jugador.puntaje ?? 0) > 0 
                            ? 'bg-yellow-500 text-black' 
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {(jugador.puntaje ?? 0).toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resumen Final */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6 border-2 border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white text-xl font-bold mb-2">
                💰 Resumen de Puntos
              </h3>
              <p className="text-white/80 text-sm">
                {titulares.length} titulares • {suplentes.length} suplentes • {jugadores.length} total
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm mb-1">Total del Equipo</p>
              <p className="text-white text-4xl font-bold">
                {puntajeTotal.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleJornadaEquipo;
