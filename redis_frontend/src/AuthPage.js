import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Home.css"; // Import Home styles for the header
import "./AuthPage.css"; // Import a CSS file for styling
import { useEffect } from "react";



function AuthPage() {
  const [userRole, setUserRole] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.role) {
      setUserRole(user.role);
    }
  }, []);


  useEffect(() => {
    document.body.classList.add("auth-body");
  
    return () => {
      document.body.classList.remove("auth-body");
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
  
    try {
      const response = await axios.post("http://localhost:3000/login", formData, {
        withCredentials: true,
      });
  
      console.log("🔹 Response after login:", response.data); // Debugging
  
      const role = response.data.role;
      setUserRole(role); // ✅ Now using setUserRole
  
      // ✅ Store user role in localStorage for later use
      localStorage.setItem("userRole", role);
  
      // ✅ Redirect based on role
      if (role === "admin") navigate("/admin-dashboard");
      else if (role === "resident") navigate("/user-page");
      else if (role === "officer") navigate("/manage-residents");
      else navigate("/pending-approval");
    } catch (error) {
      console.error("❌ Login Error:", error);
      setErrorMessage(
        error.response?.data?.message || "❌ An error occurred. Please try again."
      );
    }
  };
  
  return (
    <div className="home">
      {/* Header Section */}
      <header className="headerhome">
        <div className="logo">
          <h1>Barangay Dalipuga</h1>
        </div>
        <nav className="navbar">
          <ul>
          <li>
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault(); // Prevent default anchor behavior
          navigate('/'); // Redirect to home page
        }}
      >
        Home
      </a>
    </li>
    
          </ul>
        </nav>
      </header>

      {/* Auth Form Section */}
      <div className="auth-page">
  {/* Left Side - Welcome Section */}
  <div className="auth-left">
    <h1>Welcome to Barangay Dalipuga
      <br></br> Profiling System</h1>
    <p>Log in to continue access</p>
  </div>

  {/* Right Side - Login Section */}
  <div className="auth-right">
    <div className="auth-container">
      <h2>Log In</h2>
      
      <form onSubmit={handleSubmit}>
        <label> Username</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          required
        />
        <label>Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />

        <button type="submit" className="login-button">
          CONTINUE →
        </button>
      </form>


      {/* Display error messages */}
      {errorMessage && <div className="error">{errorMessage}</div>}
    </div>
  </div>
</div>

    </div>
  );
}

export default AuthPage;
