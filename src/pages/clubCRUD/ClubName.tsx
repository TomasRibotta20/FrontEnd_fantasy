import  { useState } from 'react';
import { CustoFormHookForm } from '../../components/forms/CustoFormHookForm';
import type { FormFieldConfig } from '../../components/forms/CustoFormHookForm';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Club() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  // Configuración del formulario de registro
  const registrationFields: FormFieldConfig[] = [
    {
      name: 'name',
      label: 'Nombre',
      type: 'text',
      placeholder: 'Ingrese el nombre aqui',
      required: true,
    },
  ];

  const handleRegistrationSubmit = async (
    formValues: Record<string, string>
  ) => {
    setIsLoading(true);
    setMessage(null);
    console.log('Datos de registro:', formValues);
    try {
      const response = await axios.post(
        'http://localhost:3000/api/clubs',
        formValues
      );
      console.log('Registro exitoso:', response.data);
      setMessage({ type: 'success', text: 'Club registrado exitosamente!' });
      setTimeout(() => {
        navigate('/ClubReadUpdateDelete');
      }, 1000); // Redirigir después de 1 segundo
    } catch (error) {
      console.error('Error al registrar el club:', error);
      setMessage({
        type: 'error',
        text: 'Error al registrar el club. Inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overflow-hidden">
      <div
        className="bg-cover bg-center bg-no-repeat flex justify-center items-center relative"
        style={{
          backgroundImage: `url('/Background_LandingPage.png')`,
          height: 'calc(100vh - 64px)', // Resta la altura de la navbar (h-16 = 64px)
        }}
      >
        <div className="absolute inset-0 bg-black opacity-30 z-0"></div>

        {/* Formulario de Registro de Clubes */}
        <div className="z-10 fixed">
          <CustoFormHookForm
            title="Registro de Club"
            fields={registrationFields}
            buttonText="Registralo!"
            buttonVariant="primary"
            buttonSize="sm"
            onSubmit={handleRegistrationSubmit}
            initialValues={{ name: '' }}
            disabled={isLoading}
          />
          <span className="z-50 absolute center w-full text-center mt-4">
            {/* Mensaje de estado */}
            {message && (
              <div
                className={`mb-4 p-3 rounded ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-700 border border-green-300 '
                    : 'bg-red-100 text-red-700 border border-red-300'
                }`}
              >
                {message.text}
              </div>
            )}
          </span>
        </div>
        {/* Formulario de Registro de Clubes */}
      </div>
    </div>
  );
}

export default Club;
