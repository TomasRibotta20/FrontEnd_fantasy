import { useMemo, memo, useCallback } from 'react';
import {
  getPositionDisplayName,
  getPlayerDisplayName,
  getShortDisplayName,
} from '../../utils/playerMapper';
import type { PlayerPosition } from '../../types/player.types';

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
  precio?: number; // ✅ Precio actual del jugador
  valor_clausula?: number; // ✅ Cláusula de rescisión (si está blindado)
}

interface FormacionEquipoCompactaProps {
  players: Player[];
  showSuplentes?: boolean;
  onPlayerClick?: (player: Player) => void;
  onPlayerSecondaryClick?: (player: Player) => void; // Para intercambio con jugador externo
  selectedPlayerId?: number | null;
  mostrarPuntajes?: boolean; // ✅ Nuevo: flag para mostrar/ocultar puntajes
  mostrarPrecios?: boolean; // ✅ Flag para mostrar/ocultar precios
}

// ✅ Componente PlayerCard memoizado fuera del componente principal
const PlayerCard = memo(
  ({
    player,
    index,
    isSelected,
    hasOnClick,
    onPlayerClick,
    onPlayerSecondaryClick: _onPlayerSecondaryClick,
    mostrarPuntaje,
    mostrarPrecio,
  }: {
    player: Player;
    index: number;
    isSelected: boolean;
    hasOnClick: boolean;
    onPlayerClick?: (player: Player) => void;
    onPlayerSecondaryClick?: (player: Player) => void;
    mostrarPuntaje?: boolean;
    mostrarPrecio?: boolean;
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
          <div className="relative mb-2">
            <img
              src={player.photo}
              alt={playerName}
              loading="lazy"
              className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-lg bg-white"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=?';
              }}
            />
            {/* ✅ Escudo dorado si tiene cláusula blindada */}
            {!!player.valor_clausula && player.precio !== undefined && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Disparar evento personalizado para mostrar info del blindaje
                  const precioBase = player.precio ?? 0;
                  const clausulaTotal = player.valor_clausula ?? 0;
                  window.dispatchEvent(
                    new CustomEvent('mostrarInfoBlindaje', {
                      detail: {
                        jugador: playerName,
                        precioBase: precioBase,
                        incremento: clausulaTotal - precioBase,
                        clausulaTotal: clausulaTotal,
                        foto: player.photo,
                      },
                    })
                  );
                }}
                className="absolute -top-2 -left-2 cursor-pointer hover:scale-110 transition-transform z-20"
                title="Ver detalles del blindaje"
              >
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-lg font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-xl border-2 border-white">
                  B
                </div>
              </button>
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
            {/* Burbuja de puntaje encima del jugador */}
            {mostrarPuntaje && player.puntaje !== undefined && (
              <div
                className={`absolute -top-1 ${
                  isSelected ? '-right-8' : '-right-1'
                } text-white text-[10px] font-bold rounded-full min-w-[24px] h-6 px-1 flex items-center justify-center shadow-lg border-2 border-white z-10 ${
                  player.puntaje > 0
                    ? 'bg-gradient-to-br from-green-400 to-green-600'
                    : player.puntaje < 0
                    ? 'bg-gradient-to-br from-red-400 to-red-600'
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}
                title={`Puntaje: ${player.puntaje}`}
              >
                {player.puntaje > 0 ? '+' : ''}
                {player.puntaje}
              </div>
            )}
          </div>

          {/* Nombre del jugador */}
          <div className="text-center bg-white/95 rounded-md px-3 py-1.5 shadow-md min-w-[75px]">
            <p className="text-xs font-bold text-gray-800 leading-tight whitespace-nowrap">
              {shortName}
            </p>
            <p className="text-[9px] text-gray-600 mt-0.5">{positionName}</p>
            {mostrarPrecio &&
              (player.precio !== undefined ||
                player.valor_clausula !== undefined) && (
                <p
                  className={`text-[10px] font-bold mt-0.5 px-1 rounded ${
                    player.valor_clausula
                      ? 'text-orange-700 bg-orange-50'
                      : 'text-green-700 bg-green-50'
                  }`}
                >
                  $
                  {(player.valor_clausula || player.precio || 0).toLocaleString(
                    'es-AR'
                  )}
                </p>
              )}
          </div>
        </div>
      </div>
    );
  },
  // ✅ Comparación personalizada: solo re-renderizar si cambia algo importante
  (prevProps, nextProps) => {
    return (
      prevProps.player.id === nextProps.player.id &&
      prevProps.player.apiId === nextProps.player.apiId &&
      prevProps.player.puntaje === nextProps.player.puntaje &&
      prevProps.player.precio === nextProps.player.precio &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.hasOnClick === nextProps.hasOnClick &&
      prevProps.mostrarPuntaje === nextProps.mostrarPuntaje &&
      prevProps.mostrarPrecio === nextProps.mostrarPrecio
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
  mostrarPrecios = false,
}: FormacionEquipoCompactaProps) => {
  const normalizePosition = useCallback((position: unknown): string => {
    if (!position) return 'unknown';

    if (typeof position === 'object' && position !== null) {
      const posObj = position as {
        id?: number;
        description?: string;
        descripcion?: string;
      };
      // Buscar descripción en español o inglés
      const posDesc = (
        posObj.descripcion ||
        posObj.description ||
        ''
      ).toLowerCase();
      const posId = String(posObj.id || '');

      // Mapeo de descripciones en español
      if (posDesc.includes('portero') || posDesc.includes('goalkeeper'))
        return 'portero';
      if (posDesc.includes('defens') || posDesc.includes('defender'))
        return 'defensor';
      if (posDesc.includes('mediocampista') || posDesc.includes('midfielder'))
        return 'mediocampista';
      if (posDesc.includes('delantero') || posDesc.includes('attack'))
        return 'delantero';

      // Mapeo de IDs a categorías (1=Portero, 2=Defensor, 3=Mediocampista, 4=Delantero)
      const positionMapById: { [key: string]: string } = {
        '1': 'portero',
        '2': 'defensor',
        '3': 'mediocampista',
        '4': 'delantero',
      };

      if (positionMapById[posId]) return positionMapById[posId];
    }

    const posStr = String(position).toLowerCase();

    // Mapeo de strings directos
    if (
      posStr === '1' ||
      posStr.includes('portero') ||
      posStr.includes('goalkeeper')
    )
      return 'portero';
    if (
      posStr === '2' ||
      posStr.includes('defens') ||
      posStr.includes('defender')
    )
      return 'defensor';
    if (
      posStr === '3' ||
      posStr.includes('mediocampista') ||
      posStr.includes('midfielder')
    )
      return 'mediocampista';
    if (
      posStr === '4' ||
      posStr.includes('delantero') ||
      posStr.includes('attack')
    )
      return 'delantero';

    return 'unknown';
  }, []);

  const formation = useMemo(() => {
    // Separar titulares y suplentes
    const titulares = players.filter((p) => p.esTitular === true);
    const suplentes = players.filter((p) => p.esTitular === false);

    // Clasificar jugadores titulares por posición
    const delanteros = titulares.filter(
      (p) => normalizePosition(p.position) === 'delantero'
    );
    const mediocampistas = titulares.filter(
      (p) => normalizePosition(p.position) === 'mediocampista'
    );
    const defensores = titulares.filter(
      (p) => normalizePosition(p.position) === 'defensor'
    );
    const porteros = titulares.filter(
      (p) => normalizePosition(p.position) === 'portero'
    );

    return {
      delanteros,
      mediocampistas,
      defensores,
      portero: porteros.slice(0, 1), // Solo un portero
      suplentes, // Todos los que NO son titulares
    };
  }, [players, normalizePosition]);

  if (!players || players.length === 0) {
    return null;
  }

  // Espaciado optimizado para pantallas pequeñas - MÁS GRANDE
  const topMargin = 20;
  const lineSpacing = 160; // Espaciado aumentado entre líneas para hacer el campo más largo
  const bottomPadding = 160; // Padding para incluir la tarjeta completa del portero + borde redondeado
  const totalHeight = topMargin + lineSpacing * 3 + bottomPadding; // Altura total del campo

  return (
    <>
      <div className="relative w-full mx-auto">
        {/* Campo de fútbol visual - versión compacta */}
        <div
          className="relative bg-green-500/30 rounded-xl p-6 w-full border-2 border-white/50"
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
              className="absolute left-0 right-0 flex justify-center items-center gap-8 z-10"
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
                  mostrarPrecio={mostrarPrecios}
                />
              ))}
            </div>
          )}

          {/* Mediocampistas */}
          {formation.mediocampistas.length > 0 && (
            <div
              className="absolute left-0 right-0 flex justify-center items-center gap-8 z-10"
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
                  mostrarPrecio={mostrarPrecios}
                />
              ))}
            </div>
          )}

          {/* Defensores */}
          {formation.defensores.length > 0 && (
            <div
              className="absolute left-0 right-0 flex justify-center items-center gap-6 z-10"
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
                  mostrarPrecio={mostrarPrecios}
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
                mostrarPrecio={mostrarPrecios}
              />
            </div>
          )}
        </div>

        {/* Jugadores suplentes - SOLO si showSuplentes es true */}
        {showSuplentes && formation.suplentes.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-white mb-2 text-center drop-shadow-md">
              Suplentes ({formation.suplentes.length})
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {formation.suplentes.map((player, index) => (
                <PlayerCard
                  key={`suplente-${player.apiId}`}
                  player={player}
                  index={index + 11}
                  isSelected={selectedPlayerId === player.apiId}
                  hasOnClick={!!onPlayerClick}
                  onPlayerClick={onPlayerClick}
                  onPlayerSecondaryClick={onPlayerSecondaryClick}
                  mostrarPuntaje={mostrarPuntajes}
                  mostrarPrecio={mostrarPrecios}
                />
              ))}
            </div>
          </div>
        )}
      </div>
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
