import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/profile.css";

const ProfilePanel = ({ onClose }) => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUser = async () => {
      const res = await axios.get(
        "http://localhost:5000/api/users/me",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(res.data);
      setName(res.data.name);
      setBio(res.data.bio || "");
    };

    fetchUser();
  }, [token]);

  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("bio", bio);
    if (profilePic) formData.append("profilePic", profilePic);

    const res = await axios.put(
      "http://localhost:5000/api/users/profile",
      formData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setUser(res.data);
    setEditMode(false);
    setProfilePic(null);
    alert("Profile updated successfully!");
  };

  if (!user) return null;

  return (
    <>
      <div className="profile-overlay" onClick={onClose}></div>

      <div className="profile-modal">

        <div className="profile-header">
          <h4>My Profile</h4>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="profile-body">

          <div className="text-center mb-3">
            {user.profilePic && (
              <img
                src={user.profilePic}
                alt="Profile"
                className="profile-image"
              />
            )}
          </div>

          {!editMode ? (
            <>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Phone:</strong> {user.phone}</p>
              <p><strong>Bio:</strong> {user.bio || "No bio"}</p>

              <button
                className="profile-btn"
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </button>
            </>
          ) : (
            <>
              <input
                className="form-control mb-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <textarea
                className="form-control mb-2"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />

              <input
                type="file"
                className="form-control mb-3"
                onChange={(e) =>
                  setProfilePic(e.target.files[0])
                }
              />

              <button
                className="profile-btn me-2"
                onClick={handleUpdate}
              >
                Save
              </button>

              <button
                className="profile-cancel-btn"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
            </>
          )}

        </div>
      </div>
    </>
  );
};

export default ProfilePanel;