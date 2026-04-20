import React, { useState } from "react";
import { signup } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import "../css/signup.css";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    setErrors({ ...errors, [e.target.name]: "" });
    setSuccess("");
  };

  const validate = () => {
    let newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(form.username)) {
      newErrors.username =
        "Only letters, numbers and underscore allowed";
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(form.phone)) {
      newErrors.phone = "Phone must be exactly 10 digits";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      newErrors.email = "Enter valid email";
    }

    if (form.password.length < 6) {
      newErrors.password = "Minimum 6 characters";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validate();

    if (Object.keys(formErrors).length > 0) {
      return setErrors(formErrors);
    }

    try {
      await signup(form);
      setSuccess("Signup successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setErrors({
        general:
          err.response?.data?.message || "Signup failed",
      });
    }
  };

  return (
    <div
      className="gradient-custom d-flex flex-column"
      style={{ minHeight: "100vh", padding: "15px" }}
    >
      <div
        className="mask-custom d-flex flex-column"
        style={{
          flex: 1,
          borderRadius: "25px",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          className="d-flex justify-content-between align-items-center px-4 py-3"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            color: "white",
          }}
        >
          <h5 style={{ marginBottom: 0 }}>ConvoFlow</h5>

          <button
            className="btn btn-danger btn-sm"
            onClick={() => navigate("/")}
          >
            Go Back
          </button>
        </div>

        {/* FORM */}
        <div className="d-flex flex-grow-1 justify-content-center align-items-center">
          <div className="glass-login">
            <h3 className="text-center mb-4 text-white">
              Create Account
            </h3>

            {errors.general && (
              <div className="error-box">{errors.general}</div>
            )}

            {success && (
              <div className="success-box">{success}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* NAME */}
                <div className="mb-3">
                  <label className="form-label text-white">
                    Name
                  </label>
                  <input
                    className="form-control glass-input"
                    name="name"
                    placeholder="Enter name"
                    onChange={handleChange}
                  />
                  {errors.name && (
                    <small className="field-error">
                      {errors.name}
                    </small>
                  )}
                </div>

                {/* USERNAME */}
                <div className="mb-3">
                  <label className="form-label text-white">
                    Username
                  </label>
                  <input
                    className="form-control glass-input"
                    name="username"
                    placeholder="Enter username"
                    onChange={handleChange}
                  />
                  {errors.username && (
                    <small className="field-error">
                      {errors.username}
                    </small>
                  )}
                </div>

                {/* PHONE */}
                <div className="mb-3">
                  <label className="form-label text-white">
                    Phone
                  </label>
                  <input
                    className="form-control glass-input"
                    name="phone"
                    placeholder="Enter phone"
                    onChange={handleChange}
                  />
                  {errors.phone && (
                    <small className="field-error">
                      {errors.phone}
                    </small>
                  )}
                </div>

                {/* EMAIL */}
                <div className="mb-3">
                  <label className="form-label text-white">
                    Email
                  </label>
                  <input
                    className="form-control glass-input"
                    name="email"
                    placeholder="Enter email"
                    onChange={handleChange}
                  />
                  {errors.email && (
                    <small className="field-error">
                      {errors.email}
                    </small>
                  )}
                </div>
              </div>

              {/* PASSWORD FULL WIDTH */}
              <div className="mb-3">
                <label className="form-label text-white">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control glass-input"
                  name="password"
                  placeholder="Enter password"
                  onChange={handleChange}
                />
                {errors.password && (
                  <small className="field-error">
                    {errors.password}
                  </small>
                )}
              </div>

              <button className="btn btn-success w-100 glass-btn mt-2">
                Signup
              </button>

              <p className="text-center text-white mt-3">
                Already have an account?{" "}
                <span
                  style={{
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  onClick={() => navigate("/login")}
                >
                  Login
                </span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;