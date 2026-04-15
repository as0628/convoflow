import React, { useState } from "react";
import { signup } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import "../css/signup.css";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    username: "", // ✅ added
    phone: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // ✅ Username validation
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(form.username)) {
    return alert(
      "Username can only contain letters, numbers, and underscore"
    );
  }

  // ✅ Phone validation (10 digits)
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(form.phone)) {
    return alert("Phone number must be exactly 10 digits");
  }

  // ✅ Email validation (NEW 🔥)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.email)) {
    return alert("Please enter a valid email address");
  }

  try {
    await signup(form);
    alert("Signup successful");
    navigate("/login");
  } catch (err) {
    alert(err.response?.data?.message || "Signup failed");
  }
};
  return (
    <div
      className="gradient-custom d-flex flex-column"
      style={{
        minHeight: "100vh",
        padding: "15px",
      }}
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
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/");
            }}
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

            <form onSubmit={handleSubmit}>

              {/* NAME */}
              <div className="mb-3">
                <label className="form-label text-white">
                  Name
                </label>
                <input
                  className="form-control glass-input"
                  name="name"
                  placeholder="Enter your name"
                  onChange={handleChange}
                  required
                />
              </div>

              {/* ✅ USERNAME (NEW) */}
              <div className="mb-3">
                <label className="form-label text-white">
                  Username
                </label>
                <input
                  className="form-control glass-input"
                  name="username"
                  placeholder="Enter username"
                  onChange={handleChange}
                  required
                />
              </div>

              {/* PHONE */}
              <div className="mb-3">
                <label className="form-label text-white">
                  Phone
                </label>
                <input
                  className="form-control glass-input"
                  name="phone"
                  placeholder="Enter phone number"
                  onChange={handleChange}
                  required
                />
              </div>

              {/* EMAIL */}
              <div className="mb-3">
                <label className="form-label text-white">
                  Email
                </label>
                <input
                  type="email"
                  className="form-control glass-input"
                  name="email"
                  placeholder="Enter email"
                  onChange={handleChange}
                  required
                />
              </div>

              {/* PASSWORD */}
              <div className="mb-4">
                <label className="form-label text-white">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control glass-input"
                  name="password"
                  placeholder="Enter password"
                  onChange={handleChange}
                  required
                />
              </div>

              <button className="btn btn-success w-100 glass-btn">
                Signup
              </button>

              <p className="text-center text-white mt-3">
                Already have an account?{" "}
                <span
                  style={{
                    cursor: "pointer",
                    color: "#fff",
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
// const Signup = () => {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     name: "",
//     phone: "",
//     email: "",
//     password: "",
//   });

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       await signup(form);
//       alert("Signup successful");
//       navigate("/login");
//     } catch (err) {
//       alert(err.response?.data?.message || "Signup failed");
//     }
//   };

//   return (
//     <div
//       className="gradient-custom d-flex flex-column"
//       style={{
//         minHeight: "100vh",
//         padding: "15px",
//       }}
//     >
//       {/* GLASS CONTAINER */}
//       <div
//         className="mask-custom d-flex flex-column"
//         style={{
//           flex: 1,
//           borderRadius: "25px",
//           overflow: "hidden",
//         }}
//       >
//         {/* HEADER */}
//         <div
//           className="d-flex justify-content-between align-items-center px-4 py-3"
//           style={{
//             borderBottom: "1px solid rgba(255,255,255,0.1)",
//             color: "white",
//           }}
//         >
//           <h5 style={{ marginBottom: 0 }}>ConvoFlow</h5>
//            <button
//             className="btn btn-danger btn-sm"
//             onClick={() => {
//               localStorage.removeItem("token");
//               navigate("/");
//             }}
//           >
//             Go Back
//           </button>
//         </div>

//         {/* CENTER FORM */}
//         <div className="d-flex flex-grow-1 justify-content-center align-items-center">

//           <div className="glass-login">
//             <h3 className="text-center mb-4 text-white">
//               Create Account
//             </h3>

//             <form onSubmit={handleSubmit}>

//               <div className="mb-3">
//                 <label className="form-label text-white">
//                   Name
//                 </label>
//                 <input
//                   className="form-control glass-input"
//                   name="name"
//                   placeholder="Enter your name"
//                   onChange={handleChange}
//                   required
//                 />
//               </div>

//               <div className="mb-3">
//                 <label className="form-label text-white">
//                   Phone
//                 </label>
//                 <input
//                   className="form-control glass-input"
//                   name="phone"
//                   placeholder="Enter phone number"
//                   onChange={handleChange}
//                   required
//                 />
//               </div>

//               <div className="mb-3">
//                 <label className="form-label text-white">
//                   Email
//                 </label>
//                 <input
//                   type="email"
//                   className="form-control glass-input"
//                   name="email"
//                   placeholder="Enter email"
//                   onChange={handleChange}
//                   required
//                 />
//               </div>

//               <div className="mb-4">
//                 <label className="form-label text-white">
//                   Password
//                 </label>
//                 <input
//                   type="password"
//                   className="form-control glass-input"
//                   name="password"
//                   placeholder="Enter password"
//                   onChange={handleChange}
//                   required
//                 />
//               </div>

//               <button className="btn btn-success w-100 glass-btn">
//                 Signup
//               </button>
//               <p className="text-center text-white mt-3">
//   Already have an account?{" "}
//   <span
//     style={{ cursor: "pointer", color: "#fff", textDecoration: "underline" }}
//     onClick={() => navigate("/login")}
//   >
//     Login
//   </span>
// </p>

//             </form>

//           </div>

//         </div>

//       </div>
//     </div>
//   );
// };

// export default Signup;


