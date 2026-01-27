import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary para capturar errores de componentes React
 * Previene que toda la aplicación se rompa si un componente falla
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // En desarrollo, loguear el error
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Aquí podrías enviar el error a un servicio de monitoreo como Sentry
    // reportError(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Si se proporciona un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback por defecto con estilo glassmorphism
      return (
        <div
          className="min-h-screen flex items-center justify-center p-8 relative"
          style={{
            backgroundImage: "url('/Background_LandingPage.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <div className="relative z-10 backdrop-blur-lg bg-white/20 rounded-2xl border-2 border-white/30 p-8 shadow-2xl max-w-lg w-full text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Algo salió mal
            </h1>
            <p className="text-white/80 mb-6">
              Ha ocurrido un error inesperado. Por favor, intenta recargar la
              página o volver al inicio.
            </p>

            {/* Mostrar detalles del error solo en desarrollo */}
            {import.meta.env.DEV && this.state.error && (
              <div className="backdrop-blur-md bg-red-500/20 rounded-xl p-4 mb-6 text-left border border-red-400/50">
                <p className="text-red-200 font-mono text-sm break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-red-300 cursor-pointer text-sm">
                      Ver stack trace
                    </summary>
                    <pre className="text-red-200 text-xs mt-2 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReload}
                className="px-6 py-3 backdrop-blur-lg bg-white/15 hover:bg-white/25 text-white rounded-xl font-semibold transition-all border-2 border-white/30"
              >
                Recargar página
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg"
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
