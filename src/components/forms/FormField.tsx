import React from 'react';

interface FormFieldProps {
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel';
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  type,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
}) => {
  return (
    <div
      className={`form_group ${className}`}
      style={{
        marginBottom: '1rem',
        marginTop: '0.1rem',
        alignItems: 'center',
        display: 'flex',
        textShadow: '0 0 5px rgba(0, 0, 0, 0.3)',
      }}
    >
      <label
        htmlFor={name}
        className="form_label"
        style={{
          display: 'block',
          marginBottom: '0.5rem',
          marginRight: '2rem',
          textShadow: '0 0 5px rgba(0, 0, 0, 0.3)',
          fontSize: '1.2rem',
        }}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        className="form_imput"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '0.5rem',
          borderRadius: '0.25rem',
          border: '1px solid #ccc',
          textAlign: 'center',
        }}
      />
    </div>
  );
};

export default FormField;
