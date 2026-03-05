/**
 * Componente reutilizable de animación de carga suave.
 * Muestra un spinner animado con un mensaje personalizable.
 *
 * Variantes:
 * - "fullpage": Pantalla completa con fondo (para carga inicial de página)
 * - "section": Sección dentro de un contenedor (para carga parcial)
 * - "inline": Pequeño, para usar dentro de botones o tarjetas
 */

interface LoadingSpinnerProps {
  /** Mensaje que se muestra debajo del spinner */
  message?: string;
  /** Variante visual */
  variant?: 'fullpage' | 'section' | 'inline';
  /** Tamaño del spinner */
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
};

const LoadingSpinner = ({
  message = 'Cargando...',
  variant = 'section',
  size,
}: LoadingSpinnerProps) => {
  const resolvedSize =
    size ??
    (variant === 'inline' ? 'sm' : variant === 'fullpage' ? 'lg' : 'md');

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      {/* Spinner con doble anillo suave */}
      <div className="relative">
        <div
          className={`${sizeMap[resolvedSize]} rounded-full border-[3px] border-white/20`}
        />
        <div
          className={`${sizeMap[resolvedSize]} rounded-full border-[3px] border-transparent border-t-white/90 border-r-white/40 absolute inset-0 animate-[spin_1s_cubic-bezier(0.4,0,0.2,1)_infinite]`}
        />
      </div>
      {message && variant !== 'inline' && (
        <p
          className={`text-white/80 font-medium drop-shadow animate-pulse ${
            resolvedSize === 'lg' ? 'text-base' : 'text-sm'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );

  if (variant === 'fullpage') {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{
            backgroundImage: "url('/Background_LandingPage.png')",
            filter: 'blur(2px)',
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10">{spinner}</div>
      </div>
    );
  }

  if (variant === 'section') {
    return (
      <div className="flex items-center justify-center py-12">{spinner}</div>
    );
  }

  // inline
  return (
    <div className="inline-flex items-center justify-center">{spinner}</div>
  );
};

export default LoadingSpinner;
