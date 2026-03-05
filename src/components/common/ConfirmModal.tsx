interface ConfirmModalProps {
  /** Whether the modal is visible */
  open: boolean;
  /** Modal title */
  title: string;
  /** Description / question shown in the body */
  message: string;
  /** Label for the confirm button (default: "Confirmar") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "Cancelar") */
  cancelLabel?: string;
  /** Extra Tailwind classes for the confirm button (default: blue) */
  confirmClassName?: string;
  /** Called when the user confirms */
  onConfirm: () => void;
  /** Called when the user cancels or clicks the backdrop */
  onCancel: () => void;
}

/**
 * Modal de confirmación reutilizable con la estética del proyecto.
 *
 * Reemplaza los `window.confirm()` nativos del navegador.
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmClassName = 'bg-blue-600 hover:bg-blue-700',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 max-w-sm w-full border border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
        <p className="text-gray-300 text-sm mb-5">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-semibold text-sm transition-all ${confirmClassName}`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold text-sm transition-all"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
