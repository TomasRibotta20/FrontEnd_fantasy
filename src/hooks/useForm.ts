import { useState } from "react";

type InputElements = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const initialFormValues = {
  email: '',
  username: '',
  password: ''
};

export const useForm = (initialValues = initialFormValues) => {
  const [formValues, setFormValues] = useState(initialValues);

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
    resetForm}

}