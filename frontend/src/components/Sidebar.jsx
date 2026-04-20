import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchUsers } from "../api/userApi";
import { accessChat } from "../api/chatApi";
import axios from "axios";
import { decryptMessage } from "../utils/encryption";
import "../css/sidebar.css";

const Sidebar = ({
  setSelectedChat,
  setSelectedGroup,
  setShowCreateGroup,
  setShowBlockedUsers,
  setShowProfile
}) => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [notFound, setNotFound] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [chats, setChats] = useState([]);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  let loggedInUserId = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      loggedInUserId = payload.userId || payload.id;
    } catch (err) {
      console.error("Invalid token");
    }
  }

  /* ================= LOAD GROUPS ================= */
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/groups`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setGroups(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchGroups();
  }, [token]);
  // higuig
  useEffect(() => {
  const handleDelete = (e) => {
    const { chatId } = e.detail;

    setChats(prev => prev.filter(c => c._id !== chatId));
  };

  window.addEventListener("chat-deleted", handleDelete);

  return () => {
    window.removeEventListener("chat-deleted", handleDelete);
  };
}, [loggedInUserId]);

  /* ================= LOAD CHATS ================= */
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/chat`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setChats(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.log(err);
      }
    };

    fetchChats();
  }, [token]);

  /* ================= REALTIME UPDATE ================= */
  useEffect(() => {
    const handleChatUpdate = (e) => {
      const { chatId, message } = e.detail;

      setChats((prev = []) => {
  const safePrev = Array.isArray(prev) ? prev : [];

  const existingChat = safePrev.find(c => c._id === chatId);

        // if (existingChat) {
        //   const updatedChat = {
        //     ...existingChat,
        //     latestMessage: message,
        //     updatedAt: new Date(),

        //     // 🔥 UNREAD UPDATE
        //     unreadCount:
        //       message.sender?._id !== loggedInUserId
        //         ? {
        //             ...existingChat.unreadCount,
        //             [loggedInUserId]:
        //               (existingChat.unreadCount?.[loggedInUserId] || 0) + 1,
        //           }
        //         : existingChat.unreadCount,
        //   };

        //   return [
        //     updatedChat,
        //     ...prev.filter(c => c._id !== chatId),
        //   ];
        // } 
        if (existingChat) {
  const updatedChat = {
    ...existingChat,
    // users: existingChat.users || [],
    users: Array.isArray(existingChat.users) ? existingChat.users : [],
    latestMessage: message,
    updatedAt: new Date(),

    // unreadCount:
    //   message.sender?._id !== loggedInUserId
    //     ? {
    //         ...existingChat.unreadCount,
    //         [loggedInUserId]:
    //           (existingChat.unreadCount?.[loggedInUserId] || 0) + 1,
    //       }
    //     : existingChat.unreadCount,
   unreadCount:
  message.sender?._id !== loggedInUserId
    ? {
        ...existingChat.unreadCount,
        [loggedInUserId]:
          (existingChat.unreadCount?.[loggedInUserId] || 0) + 1,
      }
    : existingChat.unreadCount,
  };

  return safePrev.map(c =>
  c._id === chatId ? updatedChat : c
);
}else {
  // only add if valid users exist
  if (!Array.isArray(message.chat?.users) || message.chat.users.length === 0) {
    return safePrev;
  }

  return [
    {
      _id: chatId,
      users: message.chat.users,
      latestMessage: message,
      unreadCount: {},
    },
    ...safePrev,
  ];
}
      });
    };

    window.addEventListener("chat-updated", handleChatUpdate);

    return () => {
      window.removeEventListener("chat-updated", handleChatUpdate);
    };
  }, [loggedInUserId]);
  // jhhhhhhhhhhhhh
  useEffect(() => {
  const handleGroupUpdate = (e) => {
    const { groupId, message } = e.detail;

    setGroups((prev = []) => {
      const safePrev = Array.isArray(prev) ? prev : [];

      const existingGroup = safePrev.find(
        (g) => g._id === groupId
      );

      if (existingGroup) {
        const updatedGroup = {
          ...existingGroup,
          latestMessage: message,
          updatedAt: new Date(),

          unreadCount:
            message.sender?._id !== loggedInUserId
              ? {
                  ...existingGroup.unreadCount,
                  [loggedInUserId]:
                    (existingGroup.unreadCount?.[loggedInUserId] || 0) + 1,
                }
              : existingGroup.unreadCount,
        };

        return [
          updatedGroup,
          ...safePrev.filter((g) => g._id !== groupId),
        ];
      }

      return safePrev;
    });
  };

  const handleGroupRead = (e) => {
    const { groupId } = e.detail;

    setGroups((prev = []) =>
      prev.map((g) =>
        g._id === groupId
          ? {
              ...g,
              unreadCount: {
                ...g.unreadCount,
                [loggedInUserId]: 0,
              },
            }
          : g
      )
    );
  };

  window.addEventListener("group-updated", handleGroupUpdate);
  window.addEventListener("group-read", handleGroupRead);

  return () => {
    window.removeEventListener("group-updated", handleGroupUpdate);
    window.removeEventListener("group-read", handleGroupRead);
  };
}, [loggedInUserId]);

  /* ================= SEARCH ================= */
  const handleSearch = async (e) => {
  const value = e.target.value.trim();
  setSearch(value);

  // ❌ don't search for small inputs
  if (!value || value.length < 3) {
    setUsers([]);
    setNotFound("");
    return;
  }

  // ✅ phone → only if 10 digits
  if (/^\d+$/.test(value) && value.length !== 10) {
    return;
  }

  // ✅ email → must contain @
  if (value.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return;
  }

  try {
    const res = await searchUsers(value);
    setUsers(res.data);
    setNotFound(res.data.length === 0 ? "User not found" : "");
  } catch {
    setUsers([]);
    setNotFound("User not found");
  }
};

  /* ================= OPEN CHAT ================= */
  const handleChatClick = async (chat) => {
  setSelectedChat(chat);
  setSelectedGroup(null);

  // 🔥 RESET UI IMMEDIATELY
  setChats((prev) =>
    prev.map((c) =>
      c._id === chat._id
        ? {
            ...c,
            unreadCount: {
              ...c.unreadCount,
              [loggedInUserId]: 0,
            },
          }
        : c
    )
  );

  try {
    await axios.put(
      `http://localhost:5000/api/chat/read/${chat._id}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  } catch (err) {
    console.log(err);
  }
};

  const handleUserClick = async (userId) => {
    try {
      const res = await accessChat(userId);
      setSelectedChat(res.data);
      setSelectedGroup(null);
      setUsers([]);
      setSearch("");
    } catch (err) {
      console.log(err);
    }
  };

  const handleGroupClick = async (group) => {
  setSelectedGroup(group);
  setSelectedChat(null);

  // instant UI reset
  setGroups((prev) =>
    prev.map((g) =>
      g._id === group._id
        ? {
            ...g,
            unreadCount: {
              ...g.unreadCount,
              [loggedInUserId]: 0,
            },
          }
        : g
    )
  );

  try {
    await axios.put(
      `http://localhost:5000/api/groups/read/${group._id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (err) {
    console.log(err);
  }
};

  return (
    <div className="sidebar mask-custom d-flex flex-column" style={{
      height: "100%",
      borderRadius: "20px",
      padding: "15px",
      color: "white",
    }}>

      {/* HEADER */}
      <div className="sidebar-top d-flex justify-content-between align-items-center mb-3">
        <h5 className="app-title">ConvoFlow</h5>

        <div className="sidebar-icons">
  {/* + Button */}
  <button
    className="icon-btn"
    onClick={() => setShowCreateGroup(true)}
  >
    +
  </button>

  {/* AI Button */}
 <button
  className="icon-btn"
  onClick={async () => {
    try {
      let aiChat = chats.find((chat) =>
        chat.users?.some(
          (u) =>
            u._id !== loggedInUserId &&
            u.name?.toLowerCase() === "ai assistant"
        )
      );

      if (!aiChat) {
        const AI_USER_ID = "699c366e26d4d42d1f784eb2";

        const chatRes = await accessChat(AI_USER_ID);
        aiChat = chatRes.data;
      }

      handleChatClick(aiChat);
    } catch (err) {
      console.log(err);
    }
  }}
>
  AI
</button>

  {/* Three Dot Menu */}
 {/* Three Dot Menu */}
<div className="menu-wrapper">
  <button
    className="icon-btn"
    onClick={() => setShowMenu(!showMenu)}
  >
    ⋮
  </button>

  {showMenu && (
  <div className="dropdown-menu-custom">

    <div
  onClick={() => {
    setShowProfile(true);
    setShowMenu(false);
  }}
>
  Profile
</div>


      {/* Blocked Users */}
      <div
        onClick={() => {
          setShowBlockedUsers(true);
          setShowMenu(false);
        }}
      >
        Blocked Users
      </div>

      {/* Logout */}
      <div
        className="logout-item"
        onClick={() => {
          localStorage.removeItem("token");
          navigate("/");
        }}
      >
        Logout
      </div>

    </div>
  )}
</div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="mb-3">
        <input
          className="form-control"
          placeholder="Search or start new chat"
          value={search}
          onChange={handleSearch}
          style={{ borderRadius: "20px", border: "none" }}
        />
      </div>

      {/* LIST */}
      <div className="sidebar-list">

        {/* SEARCH USERS */}
       {users.map((user) => (
  <div
    key={user._id}
    onClick={() => handleUserClick(user._id)}
    className="sidebar-item"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
    }}
  >
    👤

    <div>
      <div style={{ fontWeight: "bold" }}>
        {user.username}
      </div>

      <div style={{ fontSize: "12px", opacity: 0.7 }}>
        {user.email}
      </div>
    </div>
  </div>
))}

        {notFound && <div className="sidebar-empty">{notFound}</div>}

        {/* CHATS */}
        <div className="mt-2">
          <h6 className="sidebar-section-title">Chats</h6>

       {Array.isArray(chats) &&
  chats.map((chat) => {
    if (!chat || !Array.isArray(chat.users)) return null;

    const otherUser = chat.users.find(
      (u) => u && u._id !== loggedInUserId
    );

    if (!otherUser) return null;

    return (
      <div
        key={chat._id}
        onClick={() => handleChatClick(chat)}
        className="sidebar-item"
      >
        <div className="sidebar-left">
          <img
            src={otherUser.profilePic || "/default-avatar.png"}
            alt="User profile"
            className="sidebar-avatar"
          />

          <div className="sidebar-text">
            <div className="sidebar-name">
              {otherUser.name || otherUser.username}
            </div>

            <div className="sidebar-msg">
  {chat.latestMessage?.mediaUrl
    ? "📎 Attachment"
    : chat.latestMessage?.content
    ? decryptMessage(chat.latestMessage.content)
    : "No messages"}
</div>
          </div>
        </div>

        {chat.unreadCount?.[loggedInUserId] > 0 && (
          <div className="badge">
            {chat.unreadCount[loggedInUserId]}
          </div>
        )}
      </div>
    );
  })}
        </div>

        {/* GROUPS */}
        <div className="mt-3">
          <h6 className="sidebar-section-title">Groups</h6>

          {/* {groups.map((group) => (
            <div
              key={group._id}
              onClick={() => handleGroupClick(group)}
              className="sidebar-item"
            >
              👥 {group.name}
            </div>
          ))} */}
          {groups.map((group) => {
  const latest = group.latestMessage;

  const previewText = latest?.mediaUrl
  ? "📎 Attachment"
  : latest?.content
  ? decryptMessage(latest.content)
  : "No messages";

  const senderName = latest?.sender?.name || "";

  return (
    <div
      key={group._id}
      onClick={() => handleGroupClick(group)}
      className="sidebar-item"
    >
      <div className="sidebar-left">
        <img
          src={group.groupPic || "/group-default.png"}
          alt="Group profile"
          className="sidebar-avatar"
        />

        <div className="sidebar-text">
          <div className="sidebar-name">
            {group.name}
          </div>

          <div className="sidebar-msg">
            {senderName
              ? `${senderName}: ${previewText}`
              : previewText}
          </div>
        </div>
      </div>

      {group.unreadCount?.[loggedInUserId] > 0 && (
        <div className="badge">
          {group.unreadCount[loggedInUserId]}
        </div>
      )}
    </div>
  );
})}
        </div>

      </div>
    </div>
  );
};

export default Sidebar;