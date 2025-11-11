import { useMemo, memo, useCallback } from 'react';

interface Position {
  description: string;
}

type PlayerPosition = Position[] | string | { description: string } | unknown;

interface Player {
  id?: number;
  apiId: number;
  name: string;
  firstName?: string;
  lastName?: string;
  age: number;
  nationality: string;
  height?: number;
  weight?: number;
  photo: string;
  jerseyNumber: number;
  position: PlayerPosition;
  esTitular?: boolean;
  puntaje?: number; // ✅ Nuevo: puntaje del jugador
}

interface FormacionEquipoCompactaProps {
  players: Player[];
  showSuplentes?: boolean;
  onPlayerClick?: (player: Player) => void;
  onPlayerSecondaryClick?: (player: Player) => void; // Para intercambio con jugador externo
  selectedPlayerId?: number | null;
  mostrarPuntajes?: boolean; // ✅ Nuevo: flag para mostrar/ocultar puntajes
}

// ✅ Funciones auxiliares fuera del componente
const getPlayerDisplayName = (player: Player): string => {
  if (player.name && player.name.trim() && player.name !== 'undefined') {
    return player.name;
  }

  const firstName =
    player.firstName &&
    player.firstName.trim() &&
    player.firstName !== 'undefined'
      ? player.firstName
      : '';
  const lastName =
    player.lastName && player.lastName.trim() && player.lastName !== 'undefined'
      ? player.lastName
      : '';

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  if (firstName) {
    return firstName;
  }

  if (lastName) {
    return lastName;
  }

  return `Jugador #${
    player.jerseyNumber || Math.floor(Math.random() * 99) + 1
  }`;
};

const getShortDisplayName = (player: Player): string => {
  const fullName = getPlayerDisplayName(player);
  const parts = fullName.split(' ');

  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}. ${parts[parts.length - 1]}`;
  }

  return fullName;
};

const getPositionDisplayName = (position: unknown): string => {
  if (!position) return 'N/A';

  if (typeof position === 'object' && position !== null) {
    const posObj = position as { id?: number; description?: string };
    const posDesc = posObj.description || '';

    const positionMap: { [key: string]: string } = {
      Goalkeeper: 'Portero',
      Defender: 'Defensor',
      Midfielder: 'Mediocampista',
      Attacker: 'Delantero',
    };

    if (posDesc && positionMap[posDesc]) {
      return positionMap[posDesc];
    }

    return posDesc || 'N/A';
  }

  return String(position);
};

// ✅ Función para obtener color según puntaje
const getPuntajeColor = (puntaje: number): string => {
  if (puntaje >= 7) return 'from-green-500 to-green-600';
  if (puntaje >= 5) return 'from-yellow-500 to-yellow-600';
  return 'from-red-500 to-red-600';
};

// ✅ Componente PlayerCard memoizado fuera del componente principal
const PlayerCard = memo(
  ({
    player,
    index,
    isSelected,
    hasOnClick,
    onPlayerClick,
    onPlayerSecondaryClick,
    mostrarPuntaje,
  }: {
    player: Player;
    index: number;
    isSelected: boolean;
    hasOnClick: boolean;
    onPlayerClick?: (player: Player) => void;
    onPlayerSecondaryClick?: (player: Player) => void;
    mostrarPuntaje?: boolean;
  }) => {
    const playerName = getPlayerDisplayName(player);
    const shortName = getShortDisplayName(player);
    const positionName = getPositionDisplayName(player.position);

    return (
      <div className="flex flex-col items-center z-10 relative">
        <div
          className={`flex flex-col items-center transition-all ${
            hasOnClick ? 'cursor-pointer hover:scale-110' : ''
          } ${isSelected ? 'ring-4 ring-yellow-400 rounded-lg scale-110' : ''}`}
          style={{
            animation: 'fadeIn 0.4s ease-out',
            animationDelay: `${index * 0.05}s`,
            animationFillMode: 'backwards',
          }}
          onClick={() => onPlayerClick?.(player)}
        >
          {/* Imagen del jugador */}
          <div className="relative mb-1.5">
            <img
              src={player.photo}
              alt={playerName}
              loading="lazy"
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg bg-white"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=?';
              }}
            />
            {/* ✅ Burbuja de puntaje */}
            {mostrarPuntaje && player.puntaje !== undefined && (
              <div
                className={`absolute -top-2 -right-2 bg-gradient-to-br ${getPuntajeColor(
                  player.puntaje
                )} text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-xl border-2 border-white`}
                title={`Puntos: ${player.puntaje.toFixed(1)}`}
              >
                {player.puntaje.toFixed(1)}
              </div>
            )}
            {isSelected && (
              <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Nombre del jugador */}
          <div className="text-center bg-white/95 rounded-md px-2 py-1 shadow-md min-w-[60px]">
            <p className="text-[10px] font-bold text-gray-800 leading-tight whitespace-nowrap">
              {shortName}
            </p>
            <p className="text-[8px] text-gray-600 mt-0.5">{positionName}</p>
          </div>
        </div>

        {/* Botón para intercambio con jugador externo */}
        {onPlayerSecondaryClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayerSecondaryClick(player);
            }}
            className="mt-1.5 text-[10px] px-2 py-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-md transition-all shadow-sm hover:shadow-md transform hover:scale-105"
            title="Intercambiar con jugador nuevo"
          >
            ➕
          </button>
        )}
      </div>
    );
  },
  // ✅ Comparación personalizada: solo re-renderizar si cambia algo importante
  (prevProps, nextProps) => {
    return (
      prevProps.player.id === nextProps.player.id &&
      prevProps.player.apiId === nextProps.player.apiId &&
      prevProps.player.puntaje === nextProps.player.puntaje &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.hasOnClick === nextProps.hasOnClick &&
      prevProps.mostrarPuntaje === nextProps.mostrarPuntaje
    );
  }
);

PlayerCard.displayName = 'PlayerCard';

const FormacionEquipoCompacta = ({
  players,
  showSuplentes = false,
  onPlayerClick,
  onPlayerSecondaryClick,
  selectedPlayerId,
  mostrarPuntajes = false,
}: FormacionEquipoCompactaProps) => {
  const normalizePosition = useCallback((position: unknown): string => {
    if (!position) return 'unknown';

    if (typeof position === 'object' && position !== null) {
      const posObj = position as { id?: number; description?: string };
      const posDesc = posObj.description?.toLowerCase() || '';
      const posId = String(posObj.id || '');

      // Mapeo de IDs y descripciones a categorías
      const positionMap: { [key: string]: string } = {
        '1': 'portero',
        '2': 'defensor',
        '3': 'mediocampista',
        '4': 'portero',
        goalkeeper: 'portero',
        defender: 'defensor',
        midfielder: 'mediocampista',
        attacker: 'delantero',
      };

      if (positionMap[posDesc]) return positionMap[posDesc];
      if (positionMap[posId]) return positionMap[posId];
    }

    const posStr = String(position).toLowerCase();
    const positionMap: { [key: string]: string } = {
      '1': 'portero',
      '2': 'defensor',
      '3': 'mediocampista',
      '4': 'portero',
      goalkeeper: 'portero',
      defender: 'defensor',
      midfielder: 'mediocampista',
      attacker: 'delantero',
    };

    return positionMap[posStr] || 'unknown';
  }, []);

  const formation = useMemo(() => {
    // Clasificar jugadores por posición
    const delanteros = players.filter(
      (p) => normalizePosition(p.position) === 'delantero'
    );
    const mediocampistas = players.filter(
      (p) => normalizePosition(p.position) === 'mediocampista'
    );
    const defensores = players.filter(
      (p) => normalizePosition(p.position) === 'defensor'
    );
    const porteros = players.filter(
      (p) => normalizePosition(p.position) === 'portero'
    );

    return {
      delanteros,
      mediocampistas,
      defensores,
      portero: porteros.slice(0, 1), // Solo un portero
      suplentes: players.slice(11), // Los suplentes siguen siendo los últimos
    };
  }, [players, normalizePosition]);

  if (!players || players.length === 0) {
    return null;
  }

  // Espaciado optimizado para pantallas pequeñas - MÁS GRANDE
  const topMargin = 15;
  const lineSpacing = 140; // Espaciado aumentado entre líneas para hacer el campo más largo
  const bottomPadding = 15;
  const totalHeight = topMargin + lineSpacing * 3 + bottomPadding + 100; // 100px para el espacio del jugador más grande

  return (
    <>
      <div className="relative w-full mx-auto">
        {/* Campo de fútbol visual - versión compacta */}
        <div
          className="relative bg-green-500/30 rounded-lg p-3 w-full border-2 border-white/50"
          style={{
            height: `${totalHeight}px`,
            backgroundImage: `
              linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px),
              linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
          }}
        >
          {/* Delanteros */}
          {formation.delanteros.length > 0 && (
            <div
              className="absolute left-0 right-0 flex justify-center items-center gap-4 z-10"
              style={{ top: `${topMargin}px` }}
            >
              {formation.delanteros.map((player, index) => (
                <PlayerCard
                  key={`delantero-${player.apiId}`}
                  player={player}
                  index={index}
                  isSelected={
                    selectedPlayerId !== undefined &&
                    selectedPlayerId === player.id
                  }
                  hasOnClick={!!onPlayerClick}
                  onPlayerClick={onPlayerClick}
                  onPlayerSecondaryClick={onPlayerSecondaryClick}
                  mostrarPuntaje={mostrarPuntajes}
                />
              ))}
            </div>
          )}

          {/* Mediocampistas */}
          {formation.mediocampistas.length > 0 && (
            <div
              className="absolute left-0 right-0 flex justify-center items-center gap-4 z-10"
              style={{
                top: `${topMargin + lineSpacing * 1}px`,
              }}
            >
              {formation.mediocampistas.map((player, index) => (
                <PlayerCard
                  key={`medio-${player.apiId}`}
                  player={player}
                  index={index + 3}
                  isSelected={
                    selectedPlayerId !== undefined &&
                    selectedPlayerId === player.id
                  }
                  hasOnClick={!!onPlayerClick}
                  onPlayerClick={onPlayerClick}
                  onPlayerSecondaryClick={onPlayerSecondaryClick}
                  mostrarPuntaje={mostrarPuntajes}
                />
              ))}
            </div>
          )}

          {/* Defensores */}
          {formation.defensores.length > 0 && (
            <div
              className="absolute left-0 right-0 flex justify-center items-center gap-3 z-10"
              style={{
                top: `${topMargin + lineSpacing * 2}px`,
              }}
            >
              {formation.defensores.map((player, index) => (
                <PlayerCard
                  key={`defensor-${player.apiId}`}
                  player={player}
                  index={index + 6}
                  isSelected={
                    selectedPlayerId !== undefined &&
                    selectedPlayerId === player.id
                  }
                  hasOnClick={!!onPlayerClick}
                  onPlayerClick={onPlayerClick}
                  onPlayerSecondaryClick={onPlayerSecondaryClick}
                  mostrarPuntaje={mostrarPuntajes}
                />
              ))}
            </div>
          )}

          {/* Portero */}
          {formation.portero.length > 0 && (
            <div
              className="absolute left-0 right-0 flex justify-center z-10"
              style={{
                top: `${topMargin + lineSpacing * 3}px`,
              }}
            >
              <PlayerCard
                key={`portero-${formation.portero[0].apiId}`}
                player={formation.portero[0]}
                index={10}
                isSelected={
                  selectedPlayerId !== undefined &&
                  selectedPlayerId === formation.portero[0].id
                }
                hasOnClick={!!onPlayerClick}
                onPlayerClick={onPlayerClick}
                onPlayerSecondaryClick={onPlayerSecondaryClick}
                mostrarPuntaje={mostrarPuntajes}
              />
            </div>
          )}
        </div>

        {/* Jugadores suplentes - SOLO si showSuplentes es true */}
        {showSuplentes && formation.suplentes.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-white mb-2 text-center drop-shadow-md">
              Suplentes
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {formation.suplentes.map((player, index) => (
                <div
                  key={`suplente-${player.apiId}`}
                  className="bg-white/90 backdrop-blur-sm rounded-md px-2.5 py-1.5 shadow-md"
                  style={{
                    animation: 'fadeIn 0.4s ease-out',
                    animationDelay: `${(index + 11) * 0.05}s`,
                    animationFillMode: 'backwards',
                  }}
                >
                  <div className="text-center">
                    <p className="font-bold text-[10px] text-gray-800">
                      {getShortDisplayName(player)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `,
        }}
      />
    </>
  );
};

// ✅ Comparación personalizada para evitar re-renders innecesarios
const arePropsEqual = (
  prevProps: FormacionEquipoCompactaProps,
  nextProps: FormacionEquipoCompactaProps
) => {
  // Solo re-renderizar si cambian los jugadores, el ID seleccionado o las funciones de callback
  return (
    prevProps.players === nextProps.players &&
    prevProps.selectedPlayerId === nextProps.selectedPlayerId &&
    prevProps.showSuplentes === nextProps.showSuplentes &&
    prevProps.mostrarPuntajes === nextProps.mostrarPuntajes &&
    prevProps.onPlayerClick === nextProps.onPlayerClick &&
    prevProps.onPlayerSecondaryClick === nextProps.onPlayerSecondaryClick
  );
};

const MemoizedFormacionEquipoCompacta = memo(
  FormacionEquipoCompacta,
  arePropsEqual
);
MemoizedFormacionEquipoCompacta.displayName = 'FormacionEquipoCompacta';

export default MemoizedFormacionEquipoCompacta;
