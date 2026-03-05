import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  validarCodigoTorneo,
  unirseATorneo,
} from '../../../services/torneosService';
import type {
  UnirseATorneoData,
  TorneoListItem,
} from '../../../services/torneosService';

function UnirseATorneo() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [paso, setPaso] = useState<'codigo' | 'equipo'>('codigo');
  const [torneoValidado, setTorneoValidado] = useState<TorneoListItem | null>(
    null,
  );
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const [codigoAcceso, setCodigoAcceso] = useState('');
  const [nombreEquipo, setNombreEquipo] = useState('');

  const handleValidarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (!codigoAcceso.trim()) {
        throw new Error('El código de acceso es obligatorio');
      }

      const response = await validarCodigoTorneo({
        codigo_acceso: codigoAcceso.trim().toUpperCase(),
      });

      // response.data puede contener directamente el torneo o un objeto con torneo
      const torneoData = response.data.torneo || response.data;
      setTorneoValidado(torneoData);
      setPaso('equipo');
      setMessage({
        type: 'success',
        text: `¡Código válido! Torneo encontrado: ${torneoData.nombre}`,
      });
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : 'Código inválido o torneo no disponible';
      setMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnirse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (!nombreEquipo.trim()) {
        throw new Error('El nombre del equipo es obligatorio');
      }

      const dataToSend: UnirseATorneoData = {
        codigo_acceso: codigoAcceso.trim().toUpperCase(),
        nombre_equipo: nombreEquipo.trim(),
      };

      await unirseATorneo(dataToSend);

      setMessage({
        type: 'success',
        text: `¡Te has unido exitosamente al torneo "${torneoValidado?.nombre}"!`,
      });

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/torneos');
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : 'Error al unirse al torneo. Inténtalo de nuevo.';
      setMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVolver = () => {
    setPaso('codigo');
    setTorneoValidado(null);
    setNombreEquipo('');
    setMessage(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundImage: `url('/Background_LandingPage.png')`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      className="relative z-0"
    >
      <div className="absolute inset-0 bg-black opacity-40 z-10"></div>

      <div className="relative z-20 container mx-auto px-4 py-8 pt-32">
        {/* Mensajes */}
        {message && (
          <div
            className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-2xl shadow-2xl backdrop-blur-lg border-2 ${
              message.type === 'success'
                ? 'bg-green-500/90 border-green-400/50'
                : message.type === 'error'
                  ? 'bg-red-500/90 border-red-400/50'
                  : 'bg-blue-500/90 border-blue-400/50'
            } text-white font-bold min-w-[300px] text-center drop-shadow-xl`}
          >
            {message.text}
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Unirse a Torneo
          </h1>
          <p className="text-xl text-white/90 drop-shadow-md">
            {paso === 'codigo'
              ? 'Ingresa el código de acceso del torneo'
              : 'Completa los datos para unirte'}
          </p>
        </div>

        {/* Formulario */}
        <div className="max-w-2xl mx-auto">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border-2 border-white/20 shadow-2xl">
            {/* Indicador de pasos */}
            <div className="flex items-center justify-center mb-8">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  paso === 'codigo'
                    ? 'bg-blue-500 text-white'
                    : 'bg-green-500 text-white'
                } font-bold shadow-lg`}
              >
                1
              </div>
              <div
                className={`w-16 h-1 ${
                  paso === 'equipo' ? 'bg-green-500' : 'bg-white/30'
                }`}
              ></div>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  paso === 'equipo'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/20 text-white/60'
                } font-bold shadow-lg`}
              >
                2
              </div>
            </div>

            {/* PASO 1: Validar código */}
            {paso === 'codigo' && (
              <form onSubmit={handleValidarCodigo} className="space-y-6">
                <div>
                  <label className="block text-white font-semibold mb-2 drop-shadow">
                    Código de Acceso *
                  </label>
                  <input
                    type="text"
                    value={codigoAcceso}
                    onChange={(e) =>
                      setCodigoAcceso(e.target.value.toUpperCase())
                    }
                    required
                    maxLength={6}
                    placeholder="Ej: ABC123"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-white/30 focus:border-blue-400 focus:outline-none transition-colors text-center text-2xl font-mono font-bold tracking-widest uppercase text-white placeholder-white/40"
                    disabled={isLoading}
                  />
                  <p className="text-sm text-white/60 mt-2 text-center">
                    El código debe tener 6 caracteres
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/torneos')}
                    disabled={isLoading}
                    className="flex-1 bg-white/15 border-2 border-white/30 text-white py-3 rounded-lg font-semibold hover:bg-white/25 hover:border-white/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Validando...' : 'Validar Código'}
                  </button>
                </div>
              </form>
            )}

            {/* PASO 2: Ingresar nombre del equipo */}
            {paso === 'equipo' && torneoValidado && (
              <div className="space-y-6">
                {/* Información del torneo */}
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 rounded-xl border-2 border-blue-400/30">
                  <h3 className="text-xl font-bold text-white mb-3 drop-shadow">
                    Información del Torneo
                  </h3>
                  <div className="space-y-2 text-white/90">
                    <p>
                      <span className="font-semibold text-white">Nombre:</span>{' '}
                      {torneoValidado.nombre}
                    </p>
                    <p>
                      <span className="font-semibold text-white">
                        Participantes:
                      </span>{' '}
                      {torneoValidado.cant_participantes} /{' '}
                      {torneoValidado.cupo_maximo}
                    </p>
                    {torneoValidado.estado && (
                      <p>
                        <span className="font-semibold text-white">
                          Estado:
                        </span>{' '}
                        <span
                          className={`px-2 py-1 rounded text-sm font-bold ${
                            torneoValidado.estado === 'EN_ESPERA'
                              ? 'bg-yellow-500/30 text-yellow-300'
                              : torneoValidado.estado === 'ACTIVO'
                                ? 'bg-green-500/30 text-green-300'
                                : 'bg-gray-500/30 text-gray-300'
                          }`}
                        >
                          {torneoValidado.estado.replace('_', ' ')}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Formulario para nombre de equipo */}
                <form onSubmit={handleUnirse} className="space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-2 drop-shadow">
                      Nombre de tu Equipo *
                    </label>
                    <input
                      type="text"
                      value={nombreEquipo}
                      onChange={(e) => setNombreEquipo(e.target.value)}
                      required
                      maxLength={50}
                      placeholder="Ej: Los Galácticos"
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-white/30 focus:border-blue-400 focus:outline-none transition-colors text-white placeholder-white/40"
                      disabled={isLoading}
                    />
                    <p className="text-sm text-white/60 mt-1">
                      Este será el nombre de tu equipo en este torneo
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={handleVolver}
                      disabled={isLoading}
                      className="flex-1 bg-white/15 border-2 border-white/30 text-white py-3 rounded-lg font-semibold hover:bg-white/25 hover:border-white/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Volver
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Uniéndose...' : 'Unirse al Torneo'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnirseATorneo;
