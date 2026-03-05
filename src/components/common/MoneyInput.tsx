import { useCallback } from 'react';

interface MoneyInputProps {
  /** Valor numérico actual */
  value: number | string;
  /** Callback cuando cambia el valor (recibe el número crudo) */
  onChange: (rawValue: string) => void;
  /** Placeholder (se formatea automáticamente si es un número) */
  placeholder?: string;
  /** Valor mínimo permitido para los botones de decremento */
  min?: number;
  /** Paso de incremento/decremento (default: 100000) */
  step?: number;
  /** Color de borde en focus: 'green' | 'yellow' (default: 'green') */
  focusColor?: 'green' | 'yellow';
  /** Clases adicionales para el contenedor */
  className?: string;
  /** Deshabilitado */
  disabled?: boolean;
}

/**
 * Input de dinero con formato de puntos de miles y botones stepper ▲▼.
 * Estética consistente con el mercado de la app.
 */
export default function MoneyInput({
  value,
  onChange,
  placeholder = '0',
  min = 0,
  step = 100000,
  focusColor = 'green',
  className = '',
  disabled = false,
}: MoneyInputProps) {
  const numericValue =
    typeof value === 'string' ? parseFloat(value) || 0 : value || 0;

  const formattedDisplay =
    numericValue > 0 ? numericValue.toLocaleString('es-AR') : '';

  const formattedPlaceholder = !isNaN(Number(placeholder))
    ? Number(placeholder).toLocaleString('es-AR')
    : placeholder;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9]/g, '');
      onChange(raw);
    },
    [onChange],
  );

  const handleIncrement = useCallback(() => {
    const base = numericValue > 0 ? numericValue : min;
    const newVal = base + step;
    onChange(newVal.toString());
  }, [numericValue, step, min, onChange]);

  const handleDecrement = useCallback(() => {
    const newVal = Math.max(min, numericValue - step);
    onChange(newVal.toString());
  }, [numericValue, step, min, onChange]);

  const focusClasses =
    focusColor === 'yellow'
      ? 'focus:border-yellow-400 focus:ring-yellow-400/30'
      : 'focus:border-green-400 focus:ring-green-400/30';

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        value={formattedDisplay}
        onChange={handleChange}
        placeholder={formattedPlaceholder}
        disabled={disabled}
        className={`w-full bg-white/10 border-2 border-white/30 rounded-lg pl-4 pr-12 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 ${focusClasses} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
      />
      {/* Botones de incremento/decremento */}
      <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l border-white/20">
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled}
          className="flex-1 w-10 flex items-center justify-center bg-white/5 hover:bg-white/20 text-white/70 hover:text-white text-sm transition-all rounded-tr-lg border-b border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          title={`+$${step.toLocaleString('es-AR')}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled}
          className="flex-1 w-10 flex items-center justify-center bg-white/5 hover:bg-white/20 text-white/70 hover:text-white text-sm transition-all rounded-br-lg disabled:opacity-50 disabled:cursor-not-allowed"
          title={`-$${step.toLocaleString('es-AR')}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
