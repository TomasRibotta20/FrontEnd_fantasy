import { useState } from 'react';

interface Position {
  description: string;
}

type PlayerPosition = Position[] | string | { description: string } | unknown;

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

const FormacionEquipo = ({
  players,
  compact = false,
  showSuplentes = true,
}: FormacionEquipoProps) => {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const getPlayerName = (player: Player): string => {
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
      player.lastName &&
      player.lastName.trim() &&
      player.lastName !== 'undefined'
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
    const cardSize = compact ? 'w-20 h-20' : 'w-16 h-16';
    const textSize = compact ? 'text-sm' : 'text-xs';
    const positionTextSize = compact ? 'text-xs' : 'text-[10px]';
    const padding = compact ? 'p-3' : 'p-2.5';

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
                'https://via.placeholder.com/64x64/4F46E5/FFFFFF?text=⚽';
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

  const organizePlayersInFormation = (players: Player[]) => {
    const formation = {
      delanteros: players.slice(0, 3),
      mediocampistas: players.slice(3, 6),
      defensores: players.slice(6, 10),
      portero: players.slice(10, 11),
      suplentes: players.slice(11),
    };
    return formation;
  };

  if (!players || players.length === 0) {
    return null;
  }

  const formation = organizePlayersInFormation(players);
  const fieldHeight = compact ? 'min-h-[580px]' : 'h-[550px]';

  // GAP UNIFORME para todos los jugadores horizontalmente
  const uniformGap = compact ? 'gap-8' : 'gap-7';

  // Distancia UNIFORME entre todas las líneas (delanteros, medios, defensores, portero)
  // Ajustado para que el equipo quede centrado verticalmente en el campo
  const topMargin = compact ? 35 : 35; // margen superior
  const lineSpacing = compact ? 125 : 125; // píxeles IGUALES entre cada línea

  return (
    <>
      <div className="relative w-full max-w-3xl mx-auto px-2">
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

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes gentleGlow {
              0%, 100% { 
                opacity: 0.3;
                transform: scale(1);
              }
              50% { 
                opacity: 0.6;
                transform: scale(1.05);
              }
            }

            @keyframes twinkle {
              0%, 100% { 
                transform: scale(1) rotate(0deg);
                opacity: 0.4;
              }
              50% { 
                transform: scale(1.3) rotate(180deg);
                opacity: 1;
              }
            }
          `,
        }}
      />
    </>
  );
};

export default FormacionEquipo;
