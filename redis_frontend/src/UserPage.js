import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css"; // Reuse styles
import "./UserPage.css";
import defaultProfilePic from "../src/male-avatar.png"; // Ensure this image exists in your assets

function UserPage() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user"); // Clear session storage
    setDropdownOpen(false);
    navigate("/auth"); // Redirect to login page
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
            <li><a href="/">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>

        {/* Contact Info & User Profile */}
        <div className="header-right">

          {/* User Profile Dropdown */}
          <div className="user-profile">
            <button className="profile-button" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <img src={defaultProfilePic} alt="User Profile" className="profile-pic" />
              <span>Resident</span>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="profile-dropdown">
                <button onClick={handleLogout} className="logout-button">Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <h2>Welcome to Barangay Dalipuga</h2>
        <p>"Dalipuga: A Place of Serenity and Strength, Where Hills and Waters Tell Our Story."</p>
      </section>

      {/* Centered Info Sections */}
      <div className="home-info-sections">
        {/* About Section */}
        <section className="home-about" id="about">
          <div className="home-about-text">
            <h3>About Us</h3>
            <p>
              Dalipuga is a barangay in the city of Iligan. Its population as determined by the 2020 Census was 21,470.
              This represented 5.91% of the total population of Iligan.
            </p>
            <br />
            <p>
              The Barangay Profiling System is designed to help barangay officials manage resident records
              and improve community services.
            </p>
          </div>
          <div className="home-about-image">
            <img src="/backs.jpg" alt="Dalipuga Barangay" />
          </div>
        </section>

        {/* Two Column Section */}
        <section className="home-two-column-section">
          <div className="home-column">
            <img src="/park.jpg" alt="Barangay Dalipuga" />
            <p><b>Centennial Park</b> in Dalipuga is a scenic recreational spot.</p>
          </div>
          <div className="home-column">
            <img src="/project.jpg" alt="Community Programs" />
            <p>Programs aimed at uplifting the lives of our residents.</p>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="home-contact">
          <h3>Contact Us</h3>
          <p>
            <strong>Email:</strong> brgydalipugablgu@yahoo.com <br />
            <strong>Phone:</strong> +63 123 456 7890
          </p>
        </section>

        {/* Location Section */}
        <section id="location" className="home-location">
          <h3> Location</h3>
          <p>Dalipuga, Iligan City, Philippines</p>
          <br></br>
          <img src="/map.png" alt="Community Programs" />
        </section>
      </div>

      {/* Footer Section */}
      <footer className="home-footer">
        <p>&copy; 2025 Barangay Profiling System by Carl Joseph Samson.</p>
      </footer>
    </div>
  );
}

export default UserPage;
