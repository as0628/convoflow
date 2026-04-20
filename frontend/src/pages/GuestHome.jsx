
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/guest.css";

export default function GuestHome() {
  const navigate = useNavigate();

  useEffect(() => {
    const items = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('active');
      });
    }, { threshold: 0.15 });
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const cards = [
    { title: 'Real-time Chat', text: 'Instant messaging with fast live conversations.' },
    { title: 'Group Chats', text: 'Create groups and stay connected with everyone.' },
    { title: 'Media Sharing', text: 'Send images, videos, files and documents easily.' },
    { title: 'AI Assistant', text: 'Talk to AI for quick help and smart replies.' },
  ];

  return (
    <div className="guest-container">
      <nav className="guest-navbar">
        <h3>ConvoFlow</h3>
        <div className="nav-actions">
          <button className="ghost-btn" onClick={() => navigate('/login')}>Login</button>
          <button className="primary-btn" onClick={() => navigate('/signup')}>Create Account</button>
        </div>
      </nav>

      <section className="hero-section reveal">
        <div className="hero-text">
          <span className="badge">Modern Messaging Platform</span>
          <h1>Chat Smarter with ConvoFlow 💬</h1>
          <p>
            Real-time conversations, group chats, media sharing and AI support —
            everything you need in one beautiful chat app.
          </p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={() => navigate('/signup')}>Start Chatting</button>
            {/* <button className="ghost-btn" onClick={() => navigate('/login')}>Login</button> */}
          </div>
        </div>
        <div className="hero-image">
          <img src="https://res.cloudinary.com/dfnfls3kp/image/upload/v1772723854/fttrttttttttttttttt_z9f3ci.jpg" alt="ConvoFlow" />
        </div>
      </section>

      <section className="features-section reveal">
        <h2>Everything You Need</h2>
        <div className="features-grid">
          {cards.map((card, i) => (
            <div className="feature-card" key={i}>
              <h4>{card.title}</h4>
              <p>{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section reveal">
        <h2>Start Your Conversations Today</h2>
        <p>Secure, fast and designed for modern communication.</p>
        <button className="primary-btn" onClick={() => navigate('/signup')}>Join ConvoFlow</button>
      </section>
    </div>
  );
}
