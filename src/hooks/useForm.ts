import { useState } from "react";

type InputElements = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export const useForm = <T extends Record<string, string>>(initialValues: T) => {
  const [formValues, setFormValues] = useState<T>(initialValues);

  function handleChange(event: React.ChangeEvent<InputElements>) {
    const { name, value } = event.target;
    setFormValues({ ...formValues, [name]: value });
  }

  function resetForm() {
    setFormValues(initialValues);
  }

  return {
    formValues,
    handleChange,
    resetForm
  };
};