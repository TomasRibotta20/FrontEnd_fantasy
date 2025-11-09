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
    <div className={`form_group ${className} flex flex-col space-y-2`}>
      <label
        htmlFor={name}
        className="form_label text-white text-base font-bold drop-shadow-md"
      >
        {label}
        {required && <span className="text-yellow-300 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        className="w-full px-4 py-3 border-2 border-white/40 rounded-xl bg-white/20 backdrop-blur-md text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 transition-all duration-200 font-medium"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
    </div>
  );
};

export default FormField;
