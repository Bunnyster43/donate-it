import React, { Component } from "react";
import axios from "axios";
import "./Login.css"

class Login extends Component {
  state = {
    username: "",
    password: "",
    error: null
  };

  handleInputChange = (event) => {
    // update state values
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  handleFormSubmit = (event) => {
    event.preventDefault();
    axios.post("/login", this.state).then((res) => {
      console.log(res.data);
      if (res.data!=="invalid") {
        // if successful, set auth value on parent
        this.props.setLogin(res.data);
        this.props.history.push("/");
      }
      else {
        // show error message
        this.setState({
          error: "FAILED TO LOGIN, PLEASE TRY AGAIN"
        })
      }
    });
  };

  render() {
    return (
      <form>
      <center>
        <img className="logoD" src="images/logo.png" alt="logo"/>
        <div className="logoName">
            <span className="donate"> DoNATE </span>-  iT!
        </div>
        <span className="signupError">PLEASE LOGIN TO YOUR ACCOUNT</span><br/>
        <input className="loginInput"
          value={this.state.username}
          name="username"
          onChange={this.handleInputChange}
          type="text"
          placeholder="Username"
        />
        <br/>
        <input className="loginInput"
          value={this.state.password}
          name="password"
          onChange={this.handleInputChange}
          type="password"
          placeholder="Password"
        />
        <br/>
        <button className="loginSubmit" onClick={this.handleFormSubmit}>Submit</button>
        <br/>
        <br/>
        <span className="loginError">{this.state.error}</span>

        <footer id="footer">
            <p>&copy;<span className="copy"> Donate  </span>-  It! 2018</p>
        </footer>
        </center>
      </form>
    );
  }
}

export default Login;
