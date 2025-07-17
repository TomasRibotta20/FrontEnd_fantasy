import {useState} from "react";


export const MultipleStatesForm = () => {

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = {
      email: email,
      username: username,
      password: password
    };
    console.log(formData);
    resetForm();
  }

  const resetForm = () => {
    setEmail("");
    setUsername("");
    setPassword("");
  }

  return(
    <div>
      <h2 className="form_title">MultipleStateForm</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form_group">
          <label htmlFor="email" className="form_label">Email</label>
          <input type="text" id="email" name="email" className="form_imput" value = {email} onChange={(e) => setEmail(e.target.value)}/>
        </div>

        <div className="form_group">
          <label htmlFor="username" className="form_label">Username</label>
          <input type="text" id="username" name="username" className="form_imput" value = {username} onChange={(e) => setUsername(e.target.value)}/>
        </div>

        <div className="form_group">
          <label htmlFor="password" className="form_label">Password</label>
          <input type="text" id="password" name="password" className="form_imput" value = {password} onChange={(e) => setPassword(e.target.value)}/>
        </div>
        <button className="button" type="submit">Submit</button>
      </form>
    </div>
  )
}