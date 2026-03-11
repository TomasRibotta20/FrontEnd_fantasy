import { useState } from 'react';
import {
  getPositionType as getPositionTypeFromMapper,
  getPlayerDisplayName,
} from '../../utils/playerMapper';
import type { PlayerPosition } from '../../types/player.types';

interface Player {
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
}

interface FormacionEquipoProps {
  players: Player[];
  compact?: boolean;
  showSuplentes?: boolean;
}

/** Componente visual de formación de equipo con titulares y suplentes. */
const FormacionEquipo = ({
  players,
  compact = false,
  showSuplentes = true,
}: FormacionEquipoProps) => {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  // Usar getPlayerDisplayName del mapper
  const getPlayerName = (player: Player): string =>
    getPlayerDisplayName(player);

  const handleImageLoad = (apiId: number) => {
    setLoadedImages((prev) => new Set(prev).add(apiId));
  };

  const PlayerCard = ({
    player,
    index,
    position,
    onlyName = false,
  }: {
    player: Player;
    index: number;
    position?: string;
    onlyName?: boolean;
  }) => {
    const isLoaded = loadedImages.has(player.apiId);
    const cardSize = compact ? 'w-20 h-20' : 'w-12 h-12 sm:w-16 sm:h-16';
    const textSize = compact ? 'text-sm' : 'text-[10px] sm:text-xs';
    const positionTextSize = compact ? 'text-xs' : 'text-[9px] sm:text-[10px]';
    const padding = compact ? 'p-3' : 'p-1.5 sm:p-2.5';

    // Si es solo nombre (suplentes)
    if (onlyName) {
      return (
        <div
          className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md hover:scale-105 transform-gpu transition-all duration-300"
          style={{
            transitionDelay: `${index * 0.06}s`,
          }}
        >
          <div className="text-center">
            <h4 className="font-bold text-xs text-gray-800">
              {getPlayerName(player)}
            </h4>
            {position && (
              <p className="text-[9px] text-gray-600 font-semibold mt-0.5">
                {position}
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`relative bg-white/90 backdrop-blur-sm rounded-full ${padding} shadow-lg hover:scale-105 hover:shadow-xl transform-gpu transition-all duration-300`}
        style={{
          transitionDelay: `${index * 0.06}s`,
        }}
      >
        {/* Imagen del jugador */}
        <div className="relative mb-1">
          <img
            src={player.photo}
            alt={getPlayerName(player)}
            loading="lazy"
            className={`${cardSize} rounded-full mx-auto object-cover border-2 border-white shadow-md`}
            onLoad={() => handleImageLoad(player.apiId)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=?';
            }}
          />
          {isLoaded && (
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400/10 to-orange-400/10"
              style={{
                animation: 'gentleGlow 3s ease-in-out infinite',
                animationDelay: `${index * 0.1}s`,
              }}
            />
          )}
        </div>

        {/* Nombre del jugador */}
        <div className="text-center">
          <h4 className={`font-bold ${textSize} text-gray-800 mb-0.5`}>
            {getPlayerName(player)}
          </h4>
          {position && (
            <p className={`${positionTextSize} text-gray-600 font-semibold`}>
              {position}
            </p>
          )}
        </div>

        {/* Mostrar emojis solo si NO es modo compacto */}
        {!compact && isLoaded && (
          <>
            <div
              className="absolute -top-1 -right-1 text-yellow-400 text-sm"
              style={{
                animation: 'twinkle 2.5s ease-in-out infinite',
                animationDelay: `${index * 0.15}s`,
                opacity: 0.8,
              }}
            >
              ✨
            </div>

            <div
              className="absolute -top-1.5 -left-1.5 text-yellow-300 text-base"
              style={{
                animation: 'twinkle 3s ease-in-out infinite',
                animationDelay: `${index * 0.2}s`,
                opacity: 0.6,
              }}
            >
              ✨
            </div>
          </>
        )}
      </div>
    );
  };

  // Función para obtener el tipo de posición de un jugador (usa el mapper)
  const getPositionType = (position: PlayerPosition): string => {
    const type = getPositionTypeFromMapper(position);
    // Mapear del formato del mapper al formato usado en este componente
    switch (type) {
      case 'goalkeeper':
        return 'portero';
      case 'defender':
        return 'defensor';
      case 'midfielder':
        return 'mediocampista';
      case 'forward':
        return 'delantero';
      default:
        return 'unknown';
    }
  };

  const organizePlayersInFormation = (players: Player[]) => {
    // Clasificar jugadores por su posición real
    const porteros = players.filter(
      (p) => getPositionType(p.position) === 'portero',
    );
    const defensores = players.filter(
      (p) => getPositionType(p.position) === 'defensor',
    );
    const mediocampistas = players.filter(
      (p) => getPositionType(p.position) === 'mediocampista',
    );
    const delanteros = players.filter(
      (p) => getPositionType(p.position) === 'delantero',
    );

    // Los que no tienen posición clara van a suplentes
    const sinPosicion = players.filter(
      (p) => getPositionType(p.position) === 'unknown',
    );

    // Para formación 4-3-3: 1 portero titular, 4 defensores, 3 mediocampistas, 3 delanteros
    const formation = {
      delanteros: delanteros.slice(0, 3),
      mediocampistas: mediocampistas.slice(0, 3),
      defensores: defensores.slice(0, 4),
      portero: porteros.slice(0, 1),
      suplentes: [
        ...porteros.slice(1),
        ...defensores.slice(4),
        ...mediocampistas.slice(3),
        ...delanteros.slice(3),
        ...sinPosicion,
      ],
    };
    return formation;
  };

  if (!players || players.length === 0) {
    return null;
  }

  const formation = organizePlayersInFormation(players);
  const fieldHeight = compact ? 'min-h-[580px]' : 'min-h-[400px] sm:h-[550px]';

  // GAP UNIFORME para todos los jugadores horizontalmente
  const uniformGap = compact ? 'gap-8' : 'gap-3 sm:gap-7';

  // Distancia UNIFORME entre todas las líneas (delanteros, medios, defensores, portero)
  // Responsive: menor espacio en móvil
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const topMargin = compact ? 35 : isMobile ? 15 : 35;
  const lineSpacing = compact ? 125 : isMobile ? 90 : 125;

  return (
    <>
      <div className="relative w-full max-w-3xl mx-auto px-1 sm:px-2">
        {/* Campo de fútbol visual */}
        <div
          className={`relative bg-green-500/30 rounded-xl ${
            compact ? 'p-5' : 'p-6'
          } ${fieldHeight} w-full border-4 border-white/50`}
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px),
              linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        >
          {/* Delanteros */}
          {formation.delanteros.length > 0 && (
            <div
              className={`absolute left-0 right-0 flex justify-center items-center ${uniformGap}`}
              style={{ top: `${topMargin}px` }}
            >
              {formation.delanteros.map((player, index) => (
                <PlayerCard
                  key={`delantero-${player.apiId}`}
                  player={player}
                  index={index}
                  position="DEL"
                />
              ))}
            </div>
          )}

          {/* Mediocampistas */}
          {formation.mediocampistas.length > 0 && (
            <div
              className={`absolute left-0 right-0 flex justify-center items-center ${uniformGap}`}
              style={{
                top: `${topMargin + lineSpacing * 1}px`,
              }}
            >
              {formation.mediocampistas.map((player, index) => (
                <PlayerCard
                  key={`medio-${player.apiId}`}
                  player={player}
                  index={index + 3}
                  position="MED"
                />
              ))}
            </div>
          )}

          {/* Defensores */}
          {formation.defensores.length > 0 && (
            <div
              className={`absolute left-0 right-0 flex justify-center items-center ${uniformGap}`}
              style={{
                top: `${topMargin + lineSpacing * 2}px`,
              }}
            >
              {formation.defensores.map((player, index) => (
                <PlayerCard
                  key={`defensor-${player.apiId}`}
                  player={player}
                  index={index + 6}
                  position="DEF"
                />
              ))}
            </div>
          )}

          {/* Portero */}
          {formation.portero.length > 0 && (
            <div
              className="absolute left-0 right-0 flex justify-center"
              style={{
                top: `${topMargin + lineSpacing * 3}px`,
              }}
            >
              <PlayerCard
                key={`portero-${formation.portero[0].apiId}`}
                player={formation.portero[0]}
                index={10}
                position="POR"
              />
            </div>
          )}
        </div>

        {/* Jugadores suplentes - SOLO NOMBRES */}
        {showSuplentes && formation.suplentes.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-white mb-2 text-center drop-shadow-md">
              Suplentes
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {formation.suplentes.map((player, index) => (
                <PlayerCard
                  key={`suplente-${player.apiId}`}
                  player={player}
                  index={index + 11}
                  position="SUP"
                  onlyName={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FormacionEquipo;
