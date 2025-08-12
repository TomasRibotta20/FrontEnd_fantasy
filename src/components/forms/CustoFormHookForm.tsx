import React from 'react';
import { useForm } from '../../hooks/useForm';
import FormField from './FormField';
import Button_1 from '../button/Button_1';

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel';
  placeholder?: string;
  required?: boolean;
}

interface CustoFormHookFormProps {
  title?: string;
  fields: FormFieldConfig[];
  buttonText?: string;
  buttonVariant?: 'primary' | 'secondary' | 'danger';
  buttonSize?: 'sm' | 'md' | 'lg';
  onSubmit?: (formValues: Record<string, string>) => void;
  initialValues?: Record<string, string>;
  className?: string;
  disabled?: boolean;
}

export const CustoFormHookForm: React.FC<CustoFormHookFormProps> = ({
  title = 'Custom Form',
  fields,
  buttonText = 'Submit',
  buttonVariant = 'primary',
  buttonSize = 'md',
  onSubmit,
  initialValues = {},
  className = '',

}) => {
  // Crear valores iniciales basados en los campos
  const defaultInitialValues = fields.reduce((acc, field) => {
    acc[field.name] = initialValues[field.name] || '';
    return acc;
  }, {} as Record<string, string>);

  const { formValues, handleChange, resetForm } = useForm(defaultInitialValues);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (onSubmit) {
      onSubmit(formValues);
    } else {
      console.log('Form submitted:', formValues);
    }

    resetForm();
  };

  return (
    <div
      className={`${className} flex flex-col items-center border-4 border-gray-600 p-8 rounded-lg bg-white opacity-80 shadow-lg w-100 font-sans`}
    >
      <h2 className="form_title mb-4 text-3xl font-semibold text-black text-center">
        {title}
      </h2>
      <form
        className="form flex flex-col items-center w-full font-semibold text-black"
        onSubmit={handleSubmit}
      >
        <div
          className={`w-full space-y-4 ${
            className.includes('!w-[600px]')
              ? 'max-w-full space-y-8'
              : 'max-w-md'
          }`}
        >
          {fields.map((field) => (
            <div key={field.name} className="w-full">
              <FormField
                label={field.label}
                type={field.type}
                name={field.name}
                value={formValues[field.name] || ''}
                onChange={handleChange}
                placeholder={field.placeholder}
                required={field.required}
              />
            </div>
          ))}
        </div>

        <Button_1
          type="submit"
          variant={buttonVariant}
          size={buttonSize}
          disabled={false}
          className={className.includes('!w-[600px]') ? 'mt-10 w-full' : ''}
        >
          {buttonText}
        </Button_1>
      </form>
    </div>
  );
};
