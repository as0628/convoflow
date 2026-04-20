import React, { useEffect, useState } from "react";
import axios from "axios";
import { login } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import "../css/login.css";

const Login = () => {
  const navigate = useNavigate();
  const API = "http://localhost:5000/api/auth";

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  const [showForgot, setShowForgot] = useState(false);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    let interval;

    if (showForgot && step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [showForgot, step, timer]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({});
    setSuccess("");
  };

  const validate = () => {
    let newErrors = {};

    if (!form.identifier.trim()) {
      newErrors.identifier = "Enter username, email or phone";
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
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
      const res = await login(form);
      localStorage.setItem("token", res.data.token);

      setSuccess("Login successful! Redirecting...");

      setTimeout(() => {
        navigate("/home");
      }, 1200);
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || "Login failed",
      });
    }
  };

  const sendOtp = async () => {
    try {
      await axios.post(`${API}/forgot-password/email`, {
        email,
      });

      setStep(2);
      setTimer(60);
      setSuccess("OTP sent to your email");
      setErrors({});
    } catch (err) {
      setErrors({
        forgot:
          err.response?.data?.message || "Failed to send OTP",
      });
    }
  };

  const verifyOtp = async () => {
    try {
      await axios.post(`${API}/verify-reset-otp`, {
        identifier: email,
        otp,
      });

      setStep(3);
      setErrors({});
    } catch (err) {
      setErrors({
        forgot:
          err.response?.data?.message || "Invalid OTP",
      });
    }
  };

  const resetPassword = async () => {
    try {
      await axios.post(`${API}/reset-password`, {
        identifier: email,
        otp,
        newPassword,
      });

      setSuccess("Password changed successfully");
      setShowForgot(false);
      setStep(1);
      setEmail("");
      setOtp("");
      setNewPassword("");
    } catch (err) {
      setErrors({
        forgot:
          err.response?.data?.message ||
          "Password reset failed",
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
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/");
            }}
          >
            Go Back
          </button>
        </div>

        <div className="d-flex flex-grow-1 justify-content-center align-items-center">
          <div className="glass-login">
            <h3 className="text-center mb-4 text-white">
              Welcome Back
            </h3>

            {errors.general && (
              <div className="error-box">{errors.general}</div>
            )}

            {success && (
              <div className="success-box">{success}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-white">
                  Username / Email / Phone
                </label>

                <input
                  className="form-control glass-input"
                  name="identifier"
                  placeholder="Enter username, email or phone"
                  value={form.identifier}
                  onChange={handleChange}
                />

                {errors.identifier && (
                  <small className="field-error">
                    {errors.identifier}
                  </small>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label text-white">
                  Password
                </label>

                <input
                  type="password"
                  className="form-control glass-input"
                  name="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                />

                {errors.password && (
                  <small className="field-error">
                    {errors.password}
                  </small>
                )}
              </div>

              <div
                className="text-end mb-2"
                style={{
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "14px",
                  textDecoration: "underline",
                }}
                onClick={() => {
                  setShowForgot(true);
                  setSuccess("");
                  setErrors({});
                }}
              >
                Forgot Password?
              </div>

              <button className="btn btn-success w-100 glass-btn mt-2">
                Login
              </button>

              <p className="text-center text-white mt-3">
                Create account?{" "}
                <span
                  style={{
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  onClick={() => navigate("/signup")}
                >
                  Signup
                </span>
              </p>
            </form>
          </div>
        </div>
      </div>

      {showForgot && (
        <>
          <div
            className="profile-overlay"
            onClick={() => setShowForgot(false)}
          ></div>

          <div className="profile-modal">
            <div className="profile-header">
              <h4>Forgot Password</h4>
              <button onClick={() => setShowForgot(false)}>
                ✕
              </button>
            </div>

            <div className="profile-body">
              {errors.forgot && (
                <div className="error-box mb-2">
                  {errors.forgot}
                </div>
              )}

              {step === 1 && (
                <>
                  <input
                    className="form-control mb-3"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                  />

                  <button
                    className="profile-btn w-100"
                    onClick={sendOtp}
                  >
                    Send OTP
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <input
                    className="form-control mb-2"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value)
                    }
                  />

                  <button
                    className="profile-btn w-100 mb-2"
                    onClick={verifyOtp}
                  >
                    Verify OTP
                  </button>

                  {timer > 0 ? (
                    <p className="text-center">
                      Resend in {timer}s
                    </p>
                  ) : (
                    <button
                      className="profile-btn w-100"
                      onClick={sendOtp}
                    >
                      Resend OTP
                    </button>
                  )}
                </>
              )}

              {step === 3 && (
                <>
                  <input
                    type="password"
                    className="form-control mb-3"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                  />

                  <button
                    className="profile-btn w-100"
                    onClick={resetPassword}
                  >
                    Change Password
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Login;