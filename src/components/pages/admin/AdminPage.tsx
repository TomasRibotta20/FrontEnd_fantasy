import { useNavigate } from 'react-router-dom';

interface AdminCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

const AdminPage = () => {
  const navigate = useNavigate();

  const adminCards: AdminCard[] = [
    {
      title: 'Gestión de Usuarios',
      description: 'Administrar usuarios del sistema',
      icon: '👥',
      route: '/admin/users',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Gestión de Jugadores',
      description: 'CRUD completo de jugadores',
      icon: '⚽',
      route: '/admin/players',
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Gestión de Clubes',
      description: 'Administrar clubes de fútbol',
      icon: '🏆',
      route: '/admin/clubs',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Gestión de Posiciones',
      description: 'Configurar posiciones de juego',
      icon: '📍',
      route: '/admin/positions',
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Gestión de Equipos',
      description: 'Administrar equipos de usuarios',
      icon: '🛡️',
      route: '/UpdateTeam',
      color: 'from-indigo-500 to-blue-500',
    },
    {
      title: 'Gestión de Jornadas',
      description: 'Controlar jornadas y calcular puntos',
      icon: '📅',
      route: '/admin/jornadas',
      color: 'from-yellow-500 to-orange-500',
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{
          backgroundImage: `url('/Background_LandingPage.png')`,
          filter: 'blur(2px)',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-30"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Panel de Administración
          </h1>
          <p className="text-white/80 text-lg">
            Gestiona todos los aspectos de tu aplicación Fantasy Football
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {adminCards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.route)}
              className="group cursor-pointer"
              style={{
                animation: 'fadeIn 0.5s ease-out',
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'backwards',
              }}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl h-full">
                <div
                  className={`bg-gradient-to-br ${card.color} rounded-xl p-4 mb-4 inline-block`}
                >
                  <span className="text-4xl">{card.icon}</span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                  {card.title}
                </h3>

                <p className="text-white/70 mb-4">{card.description}</p>

                <div className="flex items-center text-blue-400 font-semibold group-hover:text-blue-300 transition-colors">
                  <span>Acceder</span>
                  <svg
                    className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Estadísticas rápidas */}
        <div className="mt-12 max-w-7xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              Estadísticas del Sistema
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">---</div>
                <div className="text-white/70">Total Usuarios</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">
                  ---
                </div>
                <div className="text-white/70">Jugadores Registrados</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">
                  ---
                </div>
                <div className="text-white/70">Clubes Activos</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-400 mb-2">
                  ---
                </div>
                <div className="text-white/70">Equipos Creados</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `,
        }}
      />
    </div>
  );
};

export default AdminPage;
