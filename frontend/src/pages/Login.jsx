import React, { useState } from "react";
import { login } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import "../css/login.css";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login(form);
      localStorage.setItem("token", res.data.token);
      navigate("/home");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div
      className="gradient-custom d-flex flex-column"
      style={{
        height: "100vh",
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
              Welcome Back
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-white">
                  Username / Email / Phone {/* ✅ updated */}
                </label>

                <input
                  className="form-control glass-input"
                  name="identifier"
                  placeholder="Enter username, email or phone" 
                  onChange={handleChange}
                  required
                />
              </div>

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
                Login
              </button>

              <p className="text-center text-white mt-3">
                Create account?{" "}
                <span
                  style={{
                    cursor: "pointer",
                    color: "#fff",
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
    </div>
  );
};

export default Login;

// import React, { useState } from "react";
// import { login } from "../api/authApi";
// import { useNavigate } from "react-router-dom";
// import "../css/login.css";

// const Login = () => {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     identifier: "",
//     password: "",
//   });

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await login(form);
//       localStorage.setItem("token", res.data.token);
//       navigate("/home");
//     } catch (err) {
//       alert(err.response?.data?.message || "Login failed");
//     }
//   };

//   return (
//     <div
//       className="gradient-custom d-flex flex-column"
//       style={{
//         height: "100vh",
//         padding: "15px",
//       }}
//     >
//       {/* GLASS APP CONTAINER */}
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

//           <button
//             className="btn btn-danger btn-sm"
//             onClick={() => {
//               localStorage.removeItem("token");
//               navigate("/");
//             }}
//           >
//              Go Back
//           </button>
//         </div>

//         {/* CENTER LOGIN FORM */}
//         <div
//           className="d-flex flex-grow-1 justify-content-center align-items-center"
//         >
//           <div className="glass-login">
//             <h3 className="text-center mb-4 text-white">
//               Welcome Back
//             </h3>

//             <form onSubmit={handleSubmit}>
//               <div className="mb-3">
//                 <label className="form-label text-white">
//                   Email or Phone
//                 </label>

//                 <input
//                   className="form-control glass-input"
//                   name="identifier"
//                   placeholder="Enter email or phone"
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
//                 Login
//               </button>
//                <p className="text-center text-white mt-3">
//   Create account?{" "}
//   <span
//     style={{ cursor: "pointer", color: "#fff", textDecoration: "underline" }}
//     onClick={() => navigate("/signup")}
//   >
//     Signup
//   </span>
// </p>
//             </form>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default Login;

