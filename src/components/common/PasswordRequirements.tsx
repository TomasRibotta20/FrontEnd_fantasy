/** Icono de informacion con tooltip que muestra los requisitos de contrasena. */
const PasswordRequirements = () => {
  return (
    <div className="relative group/pwreq inline-flex">
      <svg
        className="w-4 h-4 text-white/50 group-hover/pwreq:text-white transition-colors cursor-help"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 opacity-0 invisible group-hover/pwreq:opacity-100 group-hover/pwreq:visible transition-all duration-200 z-50 pointer-events-none">
        <div className="bg-gray-900/95 backdrop-blur-lg border border-white/20 rounded-xl p-3 shadow-2xl">
          <p className="text-white font-semibold text-xs mb-1.5">
            La contrasena debe cumplir:
          </p>
          <ul className="space-y-1 text-white/80 text-xs">
            <li className="flex items-center gap-1.5">
              <span className="text-blue-400">&#8226;</span>
              Minimo 6 caracteres
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-blue-400">&#8226;</span>
              Al menos una letra (a-z, A-Z)
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-blue-400">&#8226;</span>
              Al menos un numero (0-9)
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-blue-400">&#8226;</span>
              Especiales permitidos: @$!%*#?&
            </li>
          </ul>
        </div>
        <div className="w-2.5 h-2.5 bg-gray-900/95 border-b border-r border-white/20 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
      </div>
    </div>
  );
};

export default PasswordRequirements;
