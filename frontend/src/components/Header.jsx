import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/header.css";

const Header = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const logoutHandler = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="header d-flex justify-content-between align-items-center px-3">
      <h5 className="mb-0" style={{ cursor: "pointer" }} onClick={() => navigate("/chat")}>
        ConvoFlow
      </h5>

      <div>
        {!token ? (
          <>
            <button
              className="btn btn-outline-primary btn-sm me-2"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
            <button
              className="btn btn-success btn-sm"
              onClick={() => navigate("/signup")}
            >
              Signup
            </button>
          </>
        ) : (
          <>
            {/* ✅ NEW PROFILE BUTTON */}
            <button
              className="btn btn-outline-dark btn-sm me-2"
              onClick={() => navigate("/profile")}
            >
              Profile
            </button>

            <button
              className="btn btn-danger btn-sm"
              onClick={logoutHandler}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;
