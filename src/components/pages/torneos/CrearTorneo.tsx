import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearTorneo } from '../../../services/torneosService';
import type { CrearTorneoData } from '../../../services/torneosService';

function CrearTorneo() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState<CrearTorneoData>({
    nombre: '',
    descripcion: '',
    cupoMaximo: 4,
    nombre_equipo: '',
    fecha_inicio: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'cupoMaximo' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Validaciones
      if (!formData.nombre.trim()) {
        throw new Error('El nombre del torneo es obligatorio');
      }
      if (!formData.nombre_equipo.trim()) {
        throw new Error('El nombre del equipo es obligatorio');
      }
      if (formData.cupoMaximo < 2) {
        throw new Error('El cupo mínimo debe ser 2 participantes');
      }
      if (formData.cupoMaximo > 5) {
        throw new Error('El cupo máximo es de 5 participantes');
      }

      // Preparar datos para enviar
      const dataToSend: CrearTorneoData = {
        nombre: formData.nombre.trim(),
        cupoMaximo: formData.cupoMaximo,
        nombre_equipo: formData.nombre_equipo.trim(),
      };

      // Agregar campos opcionales solo si tienen valor
      if (formData.descripcion?.trim()) {
        dataToSend.descripcion = formData.descripcion.trim();
      }
      if (formData.fecha_inicio) {
        dataToSend.fecha_inicio = new Date(formData.fecha_inicio).toISOString();
      }

      const response = await crearTorneo(dataToSend);

      setMessage({
        type: 'success',
        text: `¡Torneo "${response.data.nombre}" creado exitosamente! Código: ${response.data.codigo_acceso}`,
      });

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/torneos');
      }, 2000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al crear el torneo. Inténtalo de nuevo.';
      setMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
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
                : 'bg-red-500/90 border-red-400/50'
            } text-white font-bold min-w-[300px] text-center drop-shadow-xl`}
          >
            {message.text}
          </div>
        )}

        {/* Formulario */}
        <div className="max-w-2xl mx-auto">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl border-2 border-white/40 p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                Crear Nuevo Torneo
              </h1>
              <p className="text-white/80 drop-shadow-md">
                Completa los datos para crear tu torneo
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre del torneo */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Nombre del Torneo *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  placeholder="Ej: Liga Premier Fantasy 2024"
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 focus:bg-white/30 focus:outline-none transition-all text-white placeholder-white/60"
                  disabled={isLoading}
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  maxLength={500}
                  rows={3}
                  placeholder="Describe tu torneo..."
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 focus:bg-white/30 focus:outline-none transition-all text-white placeholder-white/60 resize-none"
                  disabled={isLoading}
                />
              </div>

              {/* Cupo máximo */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Cupo Máximo de Participantes *
                </label>
                <input
                  type="number"
                  name="cupoMaximo"
                  value={formData.cupoMaximo}
                  onChange={handleChange}
                  required
                  min={2}
                  max={5}
                  placeholder="Ej: 4"
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 focus:bg-white/30 focus:outline-none transition-all text-white placeholder-white/60"
                  disabled={isLoading}
                />
                <p className="text-sm text-white/70 mt-1">
                  Mínimo 2, máximo 5 participantes
                </p>
              </div>

              {/* Nombre del equipo */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Nombre de tu Equipo *
                </label>
                <input
                  type="text"
                  name="nombre_equipo"
                  value={formData.nombre_equipo}
                  onChange={handleChange}
                  required
                  maxLength={50}
                  placeholder="Ej: Los Galácticos"
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 focus:bg-white/30 focus:outline-none transition-all text-white placeholder-white/60"
                  disabled={isLoading}
                />
                <p className="text-sm text-white/70 mt-1">
                  Este será el nombre de tu equipo en este torneo
                </p>
              </div>

              {/* Fecha de inicio */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Fecha de Inicio (Opcional)
                </label>
                <input
                  type="datetime-local"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 focus:bg-white/30 focus:outline-none transition-all text-white [color-scheme:dark]"
                  disabled={isLoading}
                  style={{
                    colorScheme: 'dark',
                  }}
                />
                <p className="text-xs text-white/60 mt-1">
                  Selecciona fecha y hora de inicio del torneo
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/torneos')}
                  disabled={isLoading}
                  className="flex-1 bg-white/20 text-white py-3 rounded-lg font-semibold border-2 border-white/30 hover:bg-white/30 hover:border-white/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-green-500/80 text-white py-3 rounded-lg font-semibold border-2 border-green-400/50 hover:bg-green-500 hover:border-green-400 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creando...' : 'Crear Torneo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CrearTorneo;
