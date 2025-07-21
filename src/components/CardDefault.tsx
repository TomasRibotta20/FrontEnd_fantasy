//import React from 'react';
import { Button_1 } from './button';

interface Club {
  id: number;
  id_api: number;
  nombre: string;
  // add other properties as needed
}
interface CardDefaultProps {
  club: Club;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'card';
  onEdit?: () => void;
  onDelete?: () => void;
}

function CardDefault({
  club,
  size = 'md',
  className = '',
  type = 'card',
  onEdit,
  onDelete,
}: CardDefaultProps) {
  const baseClasses =
    'border-4 border-gray-600 rounded-lg shadow-md p-4 w-70 h-40 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between inner-shadow-lg ';

  return (
    <div className={`${baseClasses} ${size} ${className}`} data-type={type}>
      {club.id && club.nombre ? (
        <div
          className="flex flex-col items-center "
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          <h3
            className="text-lg font-semibold"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            ID: {club.id}
          </h3>
          <h3
            className="text-lg font-semibold"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            Nombre: {club.nombre}
          </h3>
        </div>
      ) : null}
      <div className="flex justify-between mt-4">
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
