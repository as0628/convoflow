import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/BlockedUsersPanel.css";

const BlockedUsersPanel = ({ onClose }) => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchBlocked();
  }, []);

  const fetchBlocked = async () => {
    const res = await axios.get(
      "http://localhost:5000/api/users/blocked",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setBlockedUsers(res.data);
  };

  const handleUnblock = async (userId) => {
    await axios.post(
      "http://localhost:5000/api/users/unblock",
      { userIdToUnblock: userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchBlocked();
  };

  return (
    <>
      <div className="blocked-overlay" onClick={onClose}></div>

      <div className="blocked-panel">

        <div className="blocked-header">
          <button onClick={onClose}>←</button>
          <h4>Blocked Users</h4>
        </div>

        <div className="blocked-body">

          {blockedUsers.length === 0 && (
            <p className="text-center mt-3">
              No blocked users
            </p>
          )}

          {blockedUsers.map((user) => (
            <div key={user._id} className="blocked-user-row">
              <div className="blocked-left">
                <img src={user.profilePic} alt="" />
                <span>{user.name}</span>
              </div>

              <button
                className="unblock-btn"
                onClick={() => handleUnblock(user._id)}
              >
                Unblock
              </button>
            </div>
          ))}

        </div>
      </div>
    </>
  );
};

export default BlockedUsersPanel;