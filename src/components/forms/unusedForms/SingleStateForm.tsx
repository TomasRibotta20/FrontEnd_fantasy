import { useState } from 'react';

type InputElements = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const initialFormValues = {
  email: '',
  username: '',
  password: '',
};

export const SingleStateForm = () => {
  const [formValues, setFormValues] = useState(initialFormValues);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(formValues);
    setFormValues(initialFormValues); // Reset form values after submission
  };

  const handleChange = (event: React.ChangeEvent<InputElements>) => {
    const { name, value } = event.target;
    setFormValues(({...formValues, [name]: value,}));
  }

  return (
    <div>
      <h2 className="form_title">Single State Form</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form_group">
          <label htmlFor="email" className="form_label">
            Email
          </label>
          <input
            type="text"
            id="email"
            name="email"
            className="form_imput"
            value={formValues.email}
            onChange={handleChange}
          />
        </div>
        <div className="form_group">
          <label htmlFor="username" className="form_label">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            className="form_imput"
            value={formValues.username}
            onChange={handleChange}
          />
        </div>
        <div className="form_group">
          <label htmlFor="password" className="form_label">
            Password
          </label>
          <input
            type="text"
            id="password"
            name="password"
            className="form_imput"
            value={formValues.password}
            onChange={handleChange}
          />
        </div>
        <button className="button" type="submit">
          Submit
        </button>
      </form>
    </div>
  );
};
