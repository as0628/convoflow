import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "../css/guest.css";
const GuestHome = () => {
  const navigate = useNavigate();
  useEffect(() => {
  const elements = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    },
    { threshold: 0.2 }
  );

  elements.forEach((el) => observer.observe(el));
}, []);

  return (
    <div className="guest-container">

      {/* ===== NAVBAR ===== */}
      <nav className="guest-navbar">
        <h4>ConvoFlow</h4>

        <div>
          <button onClick={() => navigate("/login")}>
            Login
          </button>

          <button
            className="signup-btn"
            onClick={() => navigate("/signup")}
          >
            Signup
          </button>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      

       {/* ===== HERO SECTION ===== */}

<section className="hero-section">

  {/* LEFT TEXT */}
  <div className="hero-text">
    <h1>Welcome to ConvoFlow 💬</h1>

    <p>
      Send and receive messages without keeping your phone online.
      <br />
      Build conversations. Stay connected.
    </p>

    <button
      className="signup-btn"
      onClick={() => navigate("/signup")}
    >
      Get Started
    </button>
  </div>

  {/* RIGHT IMAGE */}
  <div className="hero-image">
    <img
      src="https://res.cloudinary.com/dfnfls3kp/image/upload/v1772723854/fttrttttttttttttttt_z9f3ci.jpg"
      alt="chat preview"
    />
  </div>

</section>

      {/* ===== SERVICES ===== */}
      <section className="services-section reveal">
        <h2>At Your Service</h2>

        <div className="services-grid">

          <div className="service-card">
            💬
            <h5>Real-time Chat</h5>
            <p>Instant messaging with WebSocket support.</p>
          </div>

          <div className="service-card">
            👥
            <h5>Group Conversations</h5>
            <p>Create and manage unlimited chat groups.</p>
          </div>

          <div className="service-card">
            📎
            <h5>Media Sharing</h5>
            <p>Send images, videos, and documents easily.</p>
          </div>

          <div className="service-card">
            🔒
            <h5>Secure & Private</h5>
            <p>JWT authentication with protected routes.</p>
          </div>

        </div>
      </section>

      {/* ===== APP PREVIEW ===== */}
     <section className="portfolio-section reveal">

        <h2>App Preview</h2>

        <div className="portfolio-grid">

          <div className="portfolio-item"></div>
          <div className="portfolio-item"></div>
          <div className="portfolio-item"></div>
          <div className="portfolio-item"></div>
          <div className="portfolio-item"></div>
          <div className="portfolio-item"></div>

        </div>

      </section>

    </div>
  );
};

export default GuestHome;