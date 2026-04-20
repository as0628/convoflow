import React, { useState } from "react";
import axios from "axios";
import { searchUsers } from "../api/userApi";
import "../css/CreateGroupPanel.css";

const CreateGroupPanel = ({ onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const token = localStorage.getItem("token");

  /* ================= SEARCH USERS ================= */
  const handleSearch = async (e) => {
  const value = e.target.value;
  setSearch(value);

  if (!value) {
    setUsers([]);
    return;
  }

  try {
    const res = await searchUsers(value);

    // 🔥 Remove AI Assistant from group members list
    const filteredUsers = res.data.filter(
      (user) =>
        user.name?.toLowerCase() !== "ai assistant"
    );

    setUsers(filteredUsers);
  } catch (err) {
    console.log(err);
  }
};
  /* ================= ADD USER ================= */
 const handleAddUser = (user) => {
  // 🔥 Never allow AI Assistant in group
  if (
    user.name?.toLowerCase() === "ai assistant"
  ) {
    return;
  }

  if (selectedUsers.find((u) => u._id === user._id)) return;

  setSelectedUsers([...selectedUsers, user]);
};

  /* ================= REMOVE USER ================= */
  const handleRemoveUser = (userId) => {
    setSelectedUsers(
      selectedUsers.filter((u) => u._id !== userId)
    );
  };

  /* ================= CREATE GROUP ================= */
  const handleCreateGroup = async () => {
    if (!groupName) {
      alert("Please enter group name");
      return;
    }

    if (selectedUsers.length < 1) {
      alert("Select at least 1 member");
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/groups`,
        {
          name: groupName,
          members: selectedUsers.map((u) => u._id),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const toast = document.createElement("div");
toast.className = "custom-toast";
toast.innerText = "✅ Group created successfully";
document.body.appendChild(toast);

setTimeout(() => {
  toast.remove();
}, 2500);
      onClose(); // 👈 close panel instead of navigating
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <div className="contact-overlay" onClick={onClose}></div>

      <div className="contact-info-panel">
        <div className="contact-header">
          <h4>Create Group</h4>
          <button className="close-contact-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="p-3">

          <input
            className="form-control mb-3"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <input
            className="form-control mb-3"
            placeholder="Search users"
            value={search}
            onChange={handleSearch}
          />

          {/* USERS LIST */}
          <div className="user-search-list">
            {users.map((user) => (
              <div
                key={user._id}
                className="user-row"
                onClick={() => handleAddUser(user)}
              >
                <img src={user.profilePic} alt="" />
                <span>{user.name}</span>
              </div>
            ))}
          </div>

          <hr />

          {/* SELECTED MEMBERS */}
          <h6>Selected Members</h6>
          <div className="selected-users">
            {selectedUsers.map((user) => (
              <span key={user._id} className="selected-chip">
                {user.name}
                <span
                  className="remove-chip"
                  onClick={() =>
                    handleRemoveUser(user._id)
                  }
                >
                  ✕
                </span>
              </span>
            ))}
          </div>

          <button
            className="create-group-btn mt-3"
            onClick={handleCreateGroup}
          >
            Create Group
          </button>

        </div>
      </div>
    </>
  );
};

export default CreateGroupPanel;