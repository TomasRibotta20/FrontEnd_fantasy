import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import apiClient from '../../../services/apiClient';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  rol: string;
}

const MiPerfil = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para edición
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/api/users/profile');
        const profileData = response.data?.data || response.data;
        setProfile(profileData);
        setNewUsername(profileData.username);
      } catch (err) {
        console.error('Error al cargar perfil:', err);
        setError('No se pudo cargar el perfil');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSaveUsername = async () => {
    if (!newUsername.trim() || newUsername.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await apiClient.put('/api/users/profile', {
        username: newUsername.trim(),
      });
      const updatedProfile = response.data?.data || response.data;
      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccessMessage('Nombre de usuario actualizado correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error('Error al actualizar perfil:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Error al actualizar el perfil';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div
        className="min-h-screen pt-24 pb-8 px-8 flex items-center justify-center relative"
        style={{
          backgroundImage: "url('/Background_LandingPage.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="text-center text-white relative z-10">
          <div className="animate-spin text-6xl mb-4">●</div>
          <p className="text-xl">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pt-24 pb-8 px-8 relative"
      style={{
        backgroundImage: "url('/Background_LandingPage.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black opacity-40"></div>
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/home')}
            className="text-white hover:text-gray-300 mb-4 flex items-center gap-2 transition-colors"
          >
            ← Volver al Inicio
          </button>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">
            Mi Perfil
          </h1>
        </div>

        {/* Mensajes de error y éxito */}
        {error && (
          <div className="backdrop-blur-lg bg-red-500/20 border-2 border-red-400/50 text-white p-4 rounded-xl mb-6">
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="backdrop-blur-lg bg-green-500/20 border-2 border-green-400/50 text-white p-4 rounded-xl mb-6">
            <p>{successMessage}</p>
          </div>
        )}

        {/* Card del Perfil */}
        <div className="backdrop-blur-lg bg-white/20 rounded-2xl border-2 border-white/30 p-8 shadow-2xl">
          {/* Avatar y nombre */}
          <div className="flex items-center gap-6 mb-8 pb-6 border-b border-white/20">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
              {profile?.username?.charAt(0).toUpperCase() ||
                user?.username?.charAt(0).toUpperCase() ||
                '?'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {profile?.username || user?.username}
              </h2>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  profile?.rol === 'admin'
                    ? 'bg-red-500/30 text-red-200 border border-red-400/50'
                    : 'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                }`}
              >
                {profile?.rol === 'admin' ? 'Administrador' : 'Usuario'}
              </span>
            </div>
          </div>

          {/* Información del perfil */}
          <div className="space-y-6">
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Nombre de Usuario
              </label>
              {isEditing ? (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="flex-1 bg-white/10 border-2 border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-400/60 transition-colors"
                    placeholder="Nuevo nombre de usuario"
                    minLength={3}
                    maxLength={100}
                  />
                  <button
                    onClick={handleSaveUsername}
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-xl font-semibold transition-all shadow-lg"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setNewUsername(profile?.username || '');
                      setError(null);
                    }}
                    className="px-6 py-3 backdrop-blur-md bg-white/15 hover:bg-white/25 text-white rounded-xl font-semibold transition-all border-2 border-white/30"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between backdrop-blur-md bg-white/10 rounded-xl px-4 py-3 border-2 border-white/30">
                  <span className="text-white text-lg font-medium">
                    {profile?.username || user?.username}
                  </span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 rounded-lg font-semibold transition-all border border-blue-400/40"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Correo Electrónico
              </label>
              <div className="backdrop-blur-md bg-white/10 rounded-xl px-4 py-3 border-2 border-white/30">
                <span className="text-white text-lg font-medium">
                  {profile?.email || user?.email}
                </span>
              </div>
              <p className="text-white/70 text-xs mt-1">
                El correo electrónico no se puede cambiar
              </p>
            </div>

            {/* ID de Usuario */}
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                ID de Usuario
              </label>
              <div className="backdrop-blur-md bg-white/10 rounded-xl px-4 py-3 border-2 border-white/30">
                <span className="text-white text-lg font-mono">
                  #{profile?.id || user?.id}
                </span>
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="my-8 border-t border-white/30"></div>

          {/* Sección de acciones */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg mb-4">Acciones</h3>

            {/* Cambiar contraseña */}
            <button
              onClick={() => navigate('/forgot-password')}
              className="w-full px-6 py-4 backdrop-blur-lg bg-white/15 hover:bg-white/25 text-white rounded-xl font-semibold transition-all border-2 border-white/30 hover:border-white/50 flex items-center justify-between"
            >
              <span>Cambiar Contraseña</span>
              <span className="text-white/70">→</span>
            </button>

            {/* Cerrar sesión */}
            <button
              onClick={handleLogout}
              className="w-full px-6 py-4 backdrop-blur-lg bg-gradient-to-r from-red-500/40 to-pink-500/40 hover:from-red-500/60 hover:to-pink-500/60 text-white rounded-xl font-semibold transition-all border-2 border-red-400/50 flex items-center justify-between"
            >
              <span>Cerrar Sesión</span>
              <span className="text-white/70">→</span>
            </button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 text-center">
          <p className="text-white/70 text-sm">
            Miembro desde la creación de TurboFantasy
          </p>
        </div>
      </div>
    </div>
  );
};

export default MiPerfil;
