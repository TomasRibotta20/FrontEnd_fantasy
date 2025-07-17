import React from 'react';
import ballLogo from '../assets/Ball_Logo.png';
import lettersLogo from '../assets/Letters_Logo.png';

export const LandingPage: React.FC = () => {
  const handleButtonClick = () => {
    console.log('¡Botón clickeado!');
    // Aquí puedes agregar la lógica que necesites
  };

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden">
      {/* Estilos CSS personalizados para la animación */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes spin-slow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
          }
        `,
        }}
      />
      {/* Imagen de fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/Background_LandingPage.png')`,
        }}
      >
        {/* Overlay opcional para mejorar la legibilidad */}
        <div className="absolute inset-0 bg-black opacity-30"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        {/* Imagenes principales superpuestas - MÁXIMO TAMAÑO */}
        <div className="mb-2 flex flex-col items-center relative w-full max-w-none">
          {/* Pelota que gira - círculo perfecto GIGANTE */}
          <div className="animate-spin-slow relative z-10">
            <img
              src={ballLogo}
              alt="Pelota de fútbol"
              className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 xl:w-64 xl:h-64 object-cover rounded-full drop-shadow-2xl"
            />
          </div>

          {/* Logo principal superpuesto - GIGANTE MAS GRANDE QUE LA PELOTA */}
          <div className="transform transition-transform duration-300 hover:scale-105 relative z-20 -mt-16 md:-mt-20 lg:-mt-24">
            <img
              src={lettersLogo}
              alt="Logo TurboFantasy"
              className="w-full h-18 md:w-full md:h-24 lg:w-full lg:h-28 xl:w-full xl:h-36 2xl:w-full 2xl:h-44 max-w-none object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Texto principal agrandado */}
        <p
          className="text-lg md:text-xl lg:text-2xl xl:text-3xl text-white mb-8 text-center max-w-5xl font-medium leading-relaxed"
          style={{
            textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Descubre una experiencia única con nuestra plataforma
        </p>

        {/* Botón principal */}
        <button
          onClick={handleButtonClick}
          className="group relative px-10 py-5 bg-gradient-to-r from-green-500 to-blue-600 text-white text-2xl font-semibold rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:from-green-600 hover:to-blue-700 active:scale-95"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          <span className="relative z-10">Ingresa ahora</span>

          {/* Efecto de brillo al hover */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

          {/* Anillo de focus */}
          <div className="absolute inset-0 rounded-full ring-2 ring-blue-400 ring-opacity-0 group-focus:ring-opacity-50 transition-all duration-300"></div>
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
