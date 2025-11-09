import { useNavigate } from 'react-router-dom';

interface Props {
  mensaje?: string;
  mostrarBotonVolver?: boolean;
}

const EndpointNoDisponible = ({ 
  mensaje = 'Esta funcionalidad aún no está disponible en el backend',
  mostrarBotonVolver = true 
}: Props) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
          <div className="text-6xl mb-6">🚧</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Funcionalidad en Desarrollo
          </h2>
          <p className="text-white/80 text-lg mb-6">
            {mensaje}
          </p>
          
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
            <p className="text-yellow-200 text-sm">
              <strong>Nota para el desarrollador:</strong><br />
              Los endpoints del backend para esta funcionalidad aún no están implementados.
              Por favor, verifica la documentación en <code className="bg-black/30 px-2 py-1 rounded">BACKEND_ENDPOINTS_JORNADAS.md</code>
            </p>
          </div>

          {mostrarBotonVolver && (
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-all"
              >
                ← Volver
              </button>
              <button
                onClick={() => navigate('/LoggedMenu')}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all"
              >
                Ir al Menú Principal
              </button>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h3 className="text-white font-bold mb-3">📝 Endpoints necesarios:</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="bg-black/30 p-2 rounded font-mono">
              GET /jornadas
            </div>
            <div className="bg-black/30 p-2 rounded font-mono">
              GET /api/admin/config
            </div>
            <div className="bg-black/30 p-2 rounded font-mono">
              GET /api/equipos/:id/historial
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndpointNoDisponible;
