import { useState } from 'react';
import { Button_1 } from './button';

interface Club {
  id: number;
  id_api: number;
  codigo: string;
  nombre: string;
  logo: string;
  pais: string;
  fundado: number;
  estadio_nombre: string;
  estadio_ciudad: string;
  estadio_capacidad: number;
  estadio_imagen: string;
}

interface Position {
  id: number;
  description: string;
}

/**
 * CardDefault - Componente genérico para mostrar tarjetas de información
 * 
 * Puede ser usado para:
 * - Clubes: pasando el prop 'club'
 * - Posiciones: pasando el prop 'position'
 * - Contenido personalizado: pasando el prop 'title'
 * 
 * Ejemplos de uso:
 * - Para clubes: <CardDefault club={clubData} onEdit={handleEdit} onDelete={handleDelete} />
 * - Para posiciones: <CardDefault position={positionData} onEdit={handleEdit} onDelete={handleDelete} />
 * - Personalizado: <CardDefault title="Mi título" onEdit={handleEdit} onDelete={handleDelete} />
 */
interface CardDefaultProps {
  club?: Club;
  position?: Position;
  title?: string; // Para casos especiales donde solo se necesite un título
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'card';
  onEdit?: () => void;
  onDelete?: () => void;
}

function CardDefault({
  club,
  position,
  title,
  size = 'md',
  className = '',
  type = 'card',
  onEdit,
  onDelete,
}: CardDefaultProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const baseClasses =
    'border-4 border-gray-600 rounded-lg shadow-md p-3.5 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between inner-shadow-lg w-67';

  const displayValue = (value: string | number | null | undefined) => {
    return value !== null && value !== undefined && value !== ''
      ? value
      : 'null';
  };

  const displayStadiumImage = (imageUrl: string) => {
    if (!imageUrl || imageUrl === '' || imageUrl === 'null') {
      return <span>null</span>;
    }

    return (
      <div className="mt-2">
        <div className="text-xs text-gray-600 mb-1">URL: {imageUrl}</div>
        <img
          src={imageUrl}
          alt="Imagen del estadio"
          className="w-full max-w-48 h-24 object-cover rounded-md border border-gray-300"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const nextElement = e.currentTarget
              .nextElementSibling as HTMLElement;
            if (nextElement) {
              nextElement.style.display = 'block';
            }
          }}
        />
        <div className="hidden text-xs text-red-500 mt-1">
          Error al cargar la imagen
        </div>
      </div>
    );
  };

  // Determinar qué tipo de datos estamos mostrando
  const isClub = club !== undefined;
  const isPosition = position !== undefined;
  const isCustomTitle = title !== undefined;

  // Obtener título y ID apropiados
  const getTitle = () => {
    if (isCustomTitle) return title;
    if (isClub && club) return club.nombre;
    if (isPosition && position) return position.description;
    return 'Sin título';
  };

  const getId = () => {
    if (isClub && club) return club.id;
    if (isPosition && position) return position.id;
    return 'N/A';
  };

  return (
    <div
      className={`${baseClasses} ${size} ${className} ${
        isExpanded ? 'h-auto min-h-52' : 'h-52'
      }`}
      data-type={type}
    >
      <div
        className="flex flex-col flex-grow"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Información básica siempre visible */}
        <div className="flex flex-col items-center mb-3">
          <h3 className="text-lg font-semibold">ID: {displayValue(getId())}</h3>
          <h3 className="text-lg font-semibold">
            {isClub ? 'Nombre' : isPosition ? 'Descripción' : 'Título'}: {displayValue(getTitle())}
          </h3>
        </div>

        {/* Solo mostrar botón de expandir para clubes que tienen detalles adicionales */}
        {isClub && (
          <>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-3 transition-colors duration-200"
            >
              {isExpanded ? '▲ Ocultar detalles' : '▼ Mostrar más detalles'}
            </button>

            {/* Información expandida solo para clubes */}
            {isExpanded && club && (
              <div className="text-sm space-y-1 mb-4 bg-gray-50 p-3 rounded-md flex-grow">
                <div>
                  <strong>ID API:</strong> {displayValue(club.id_api)}
                </div>
                <div>
                  <strong>Código:</strong> {displayValue(club.codigo)}
                </div>
                <div>
                  <strong>Logo:</strong> {displayValue(club.logo)}
                </div>
                <div>
                  <strong>País:</strong> {displayValue(club.pais)}
                </div>
                <div>
                  <strong>Fundado:</strong> {displayValue(club.fundado)}
                </div>
                <div>
                  <strong>Estadio:</strong> {displayValue(club.estadio_nombre)}
                </div>
                <div>
                  <strong>Ciudad del Estadio:</strong>{' '}
                  {displayValue(club.estadio_ciudad)}
                </div>
                <div>
                  <strong>Capacidad del Estadio:</strong>{' '}
                  {displayValue(club.estadio_capacidad)}
                </div>
                <div>
                  <strong>Imagen del Estadio:</strong>
                  {displayStadiumImage(club.estadio_imagen)}
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Para posiciones, simplemente mostramos un espacio flexible */}
        {isPosition && (
          <div className="flex-grow"></div>
        )}
      </div>

      <div className="flex justify-between mt-auto pt-3">
        <Button_1
          size="sm"
          className="w-25 h-10 flex items-center justify-center"
          onClick={onEdit}
        >
          Editar
        </Button_1>
        <Button_1
          size="sm"
          variant="danger"
          className="w-25 h-10 flex items-center justify-center"
          onClick={onDelete}
        >
          Eliminar
        </Button_1>
      </div>
    </div>
  );
}

export default CardDefault;
