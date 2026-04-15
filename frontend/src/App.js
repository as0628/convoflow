import { BrowserRouter, Routes, Route } from "react-router-dom";
// import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import GuestHome from "./pages/GuestHome";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
// import Profile from "./components/ProfilePanel";
import BlockedUsers from "./components/BlockedUsersPanel";
import CreateGroup from "./components/CreateGroup";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest Home */}
        <Route path="/" element={<GuestHome />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Home */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      <Route path="/blocked" element={<BlockedUsers />} />
      <Route path="/create-group" element={<CreateGroup />} />
 

{/* <Route path="/profile" element={<Profile/>} /> */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;
