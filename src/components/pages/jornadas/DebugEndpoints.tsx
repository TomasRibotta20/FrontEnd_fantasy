import { useState } from 'react';
import { equiposService, estadisticasService } from '../../../services/jornadasService';

interface TestResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

const DebugEndpoints = () => {
  const [resultados, setResultados] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const testEndpoint = async (nombre: string, fn: () => Promise<unknown>) => {
    try {
      setLoading(nombre);
      const data = await fn();
      setResultados((prev) => ({ ...prev, [nombre]: { success: true, data } }));
    } catch (error) {
      setResultados((prev) => ({ ...prev, [nombre]: { success: false, error: String(error) } }));
    } finally {
      setLoading(null);
    }
  };

  const tests = [
    {
      nombre: 'Mi Equipo',
      fn: () => equiposService.getMiEquipoConPuntos()
    },
    {
      nombre: 'Historial Equipo (ID: 1)',
      fn: () => equiposService.getHistorialEquipo(1)
    },
    {
      nombre: 'Historial Equipo (ID: 2)',
      fn: () => equiposService.getHistorialEquipo(2)
    },
    {
      nombre: 'Puntajes Jornada 1',
      fn: () => estadisticasService.getPuntajesJornada(1)
    },
    {
      nombre: 'Puntajes Jornada 2',
      fn: () => estadisticasService.getPuntajesJornada(2)
    },
    {
      nombre: 'Puntajes Equipo 1 - Jornada 2',
      fn: () => equiposService.getPuntajesEquipoJornada(1, 2)
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          🔍 Debug de Endpoints
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {tests.map((test) => (
            <button
              key={test.nombre}
              onClick={() => testEndpoint(test.nombre, test.fn)}
              disabled={loading !== null}
              className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {loading === test.nombre ? '⏳' : '▶️'} {test.nombre}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {Object.entries(resultados).map(([nombre, resultado]) => (
            <div key={nombre} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">
                {resultado.success ? '✅' : '❌'} {nombre}
              </h3>
              <pre className="bg-black/30 p-4 rounded-lg text-white text-xs overflow-auto max-h-96">
                {JSON.stringify(resultado, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DebugEndpoints;
