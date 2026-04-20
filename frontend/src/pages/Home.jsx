import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import GroupChatWindow from "../components/GroupChatWindow";
import CreateGroupPanel from "../components/CreateGroup";
import ProfilePanel from "../components/ProfilePanel";
import BlockedUsersPanel from "../components/BlockedUsersPanel";
import "../css/Home.css";

// import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
const Home = () => {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);

 return (
  <div
    className="gradient-custom d-flex flex-column"
    style={{
      height: "100vh",
      padding: "15px",
    }}
  >
    {/* GLASS APP CONTAINER */}
    <div
      className="mask-custom d-flex flex-column"
      style={{
        flex: 1,
        borderRadius: "25px",
        overflow: "hidden",
      }}
    >
      {/* ===== HEADER INSIDE GLASS ===== */}
      <div
        className="d-flex justify-content-between align-items-center px-4 py-3"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          color: "white",
        }}
      >
        <h5
          style={{ cursor: "pointer", marginBottom: 0 }}
          onClick={() => setSelectedChat(null)}
        >
          ConvoFlow
        </h5>

        <div>
          <button
            className="btn btn-light btn-sm me-2"
            onClick={() => setShowProfile(true)}
          >
            Profile
          </button>

          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="main-layout">
  {/* SIDEBAR */}
  <div
    className={`sidebar-area ${
      selectedChat || selectedGroup ? "mobile-hide" : ""
    }`}
  >
    <Sidebar
      setSelectedChat={setSelectedChat}
      setSelectedGroup={setSelectedGroup}
      setShowCreateGroup={setShowCreateGroup}
      setShowBlockedUsers={setShowBlockedUsers}
      setShowProfile={setShowProfile}
    />
  </div>

  {/* CHAT AREA */}
  <div
    className={`chat-area ${
      selectedChat || selectedGroup
        ? "mobile-chat-show"
        : "mobile-chat-hide"
    }`}
  >
    {selectedGroup ? (
      <GroupChatWindow group={selectedGroup} />
    ) : selectedChat ? (
      <ChatWindow chat={selectedChat} />
    ) : (
      <div className="home-empty">
        <h2>Select a chat</h2>
      </div>
    )}
  </div>
</div>
      {/* 👇 PLACE PANEL HERE (OUTSIDE FLEX) */}
{showCreateGroup && (
  <CreateGroupPanel
    onClose={() => setShowCreateGroup(false)}
  />
)}

{showProfile && (
  <ProfilePanel onClose={() => setShowProfile(false)} />
)}

{showBlockedUsers && (
  <BlockedUsersPanel
    onClose={() => setShowBlockedUsers(false)}
  />
)}
    </div>
    
  </div>

);
};

export default Home;
