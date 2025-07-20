export const BaseForm = () => {
  return(
    <div>
      <h2 className="form_title">Base Form</h2>
      <form className="form">
        <div className="form_group">
          <label htmlFor="email" className="form_label">Email</label>
          <input type="text" id="email" name="email" className="form_imput" />
        </div>
        <div className="form_group">
          <label htmlFor="username" className="form_label">Username</label>
          <input type="text" id="username" name="username" className="form_imput" />
        </div>
        <div className="form_group">
          <label htmlFor="password" className="form_label">Password</label>
          <input type="text" id="password" name="password" className="form_imput" />
        </div>
        <button className="button" type="submit">Submit</button>
      </form>
    </div>
  )
}