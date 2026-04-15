import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  connectSocket,
  sendSocketMessage,
  disconnectSocket,
  sendTypingEvent,
  sendStopTypingEvent,sendSeenEvent,
} from "../socket";
import ContactInfo from "./ContactInfo";
import "../css/chatwindow.css";

const ChatWindow = ({ chat }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(null);
  const [lastSeen, setLastSeen] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [activeMessage, setActiveMessage] = useState(null);

  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const token = localStorage.getItem("token");

  /* ================= SAFE TOKEN DECODE ================= */
  let loggedInUserId = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      loggedInUserId = payload.userId || payload.id;
    } catch (err) {
      console.error("Invalid token");
    }
  }

 useEffect(() => {
  const handleDelete = (event) => {
    const { messageId, deleteType, userId } = event.detail;

    setMessages((prev) =>
      prev
        .map((m) => {
          if (m._id !== messageId) return m;

          // ✅ delete for everyone
          if (deleteType === "everyone") {
            return {
              ...m,
              content: "This message was deleted",
              mediaUrl: "",
              deletedForEveryone: true,
            };
          }

          // ✅ delete for me
          if (deleteType === "me" && userId === loggedInUserId) {
            return null;
          }

          return m;
        })
        .filter(Boolean)
    );
  };

  window.addEventListener("message-deleted", handleDelete);

  return () => {
    window.removeEventListener("message-deleted", handleDelete);
  };
}, [loggedInUserId]);

  /* ================= GET OTHER USER ================= */
  const otherUser =
    chat?.users?.find((u) => u._id !== loggedInUserId) || null;
    // hgghgj
    

  /* ================= INITIAL ONLINE STATUS ================= */
  useEffect(() => {
    if (!otherUser?._id) return;
    setIsOnline(otherUser.isOnline ?? false);
    setLastSeen(otherUser.lastSeen ?? null);
  }, [otherUser?._id]);

  /* ================= ONLINE / OFFLINE LISTENER ================= */
  useEffect(() => {
    if (!otherUser?._id) return;

    const handleOnline = (e) => {
      if (e.detail === otherUser._id) {
        setIsOnline(true);
        setLastSeen(null);
      }
    };

    const handleOffline = (e) => {
      if (e.detail.userId === otherUser._id) {
        setIsOnline(false);
        setLastSeen(e.detail.lastSeen);
      }
    };

    window.addEventListener("user-online", handleOnline);
    window.addEventListener("user-offline", handleOffline);

    return () => {
      window.removeEventListener("user-online", handleOnline);
      window.removeEventListener("user-offline", handleOffline);
    };
  }, [otherUser?._id]);

  /* ================= TYPING LISTENER ================= */
  useEffect(() => {
    if (!otherUser?._id) return;

    const handleTyping = (e) => {
      if (e.detail.userId === otherUser._id) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (e) => {
      if (e.detail.userId === otherUser._id) {
        setIsTyping(false);
      }
    };

    window.addEventListener("typing", handleTyping);
    window.addEventListener("stop-typing", handleStopTyping);

    return () => {
      window.removeEventListener("typing", handleTyping);
      window.removeEventListener("stop-typing", handleStopTyping);
    };
  }, [otherUser?._id]);

  /* ================= STATUS UPDATE LISTENER ================= */
  useEffect(() => {
    const handleStatusUpdate = (e) => {
      const { messageId, status } = e.detail;
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, status } : m
        )
      );
    };

    window.addEventListener("status-update", handleStatusUpdate);

    return () => {
      window.removeEventListener("status-update", handleStatusUpdate);
    };
  }, []);
  // dfs
  useEffect(() => {
  const handleClickOutside = (e) => {
    // ❗ only close if clicked outside message-box
    if (!e.target.closest(".message-box")) {
      setActiveMessage(null);
    }
  };

  window.addEventListener("click", handleClickOutside);

  return () => {
    window.removeEventListener("click", handleClickOutside);
  };
}, []);
  /* ================= LOAD CHAT + CONNECT SOCKET ================= */
  useEffect(() => {
    if (!chat?._id || !loggedInUserId) return;

    const loadMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/messages/${chat._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessages(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      }
    };

    loadMessages();
    disconnectSocket(); // 🔥 prevent duplicate connections

    connectSocket(loggedInUserId, chat._id, "chat", (msg) => {
  if (!msg?._id) return;

 setMessages((prev) => {
  const exists = prev.find((m) => m._id === msg._id);

  if (exists) {
    return prev.map((m) =>
      m._id === msg._id ? msg : m
    );
  }

  return [...prev, msg];
});
  setTimeout(() => {
  window.dispatchEvent(
    new CustomEvent("chat-updated", {
      detail: {
        chatId: chat._id,
        message: msg,
      },
    })
  );
}, 0);
  // 👁 mark message instantly seen
  // sendSeenEvent(chat._id, loggedInUserId, "chat");
});
    

    return () => disconnectSocket();
  }, [chat?._id]);
  // last seen
  useEffect(() => {
  if (!chat?._id) return;

  const markSeen = async () => {
    try {
      await axios.put(
        "http://localhost:5000/api/messages/seen/chat",
        { chatId: chat._id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      console.error("Error marking messages seen:", err);
    }
  };

  markSeen();
}, [chat?._id]);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // delete
  const deleteMessage = async (messageId, deleteType) => {
  try {
    await axios.put(
      "http://localhost:5000/api/messages/delete",
      { messageId, deleteType }, // ✅ now correct
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  } catch (err) {
    console.error(err);
  }
};
// clear chat
const clearChat = async () => {
  try {
    await axios.put(
      `http://localhost:5000/api/messages/clear/${chat._id}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setMessages([]); // instant UI clear
    setShowMenu(false);
  } catch (err) {
    console.error(err);
  }
};
// delte whole chat
const deleteChat = async () => {
  try {
    await axios.delete(
      `http://localhost:5000/api/messages/${chat._id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // 🔥 remove chat from UI (IMPORTANT)
    // window.location.reload(); // simple for now
    window.dispatchEvent(
  new CustomEvent("chat-deleted", {
    detail: { chatId: chat._id },
  })
);

  } catch (err) {
    console.error(err);
  }
};
  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!chat?._id) return;
    if (!text.trim() && !file) return;

    try {
      const formData = new FormData();
      formData.append("content", text);
      formData.append("chatId", chat._id);
      if (file) formData.append("file", file);

      const res = await axios.post(
        "http://localhost:5000/api/messages",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      sendSocketMessage(chat._id, res.data);
      
      sendStopTypingEvent(chat._id, loggedInUserId, "chat");

      setText("");
      setFile(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (!chat || !Array.isArray(chat.users)) {
    return (
      <div className="welcome">
        <h2>Select a chat</h2>
      </div>
    );
  }
  // last seen
  const formatLastSeen = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  if (isToday) return `Last seen today ${time}`;
  if (isYesterday) return `Last seen yesterday ${time}`;

  return `Last seen ${date.toLocaleDateString()} ${time}`;
};

const getDateLabel = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString();
};
return (
  <div className="chat-window mask-custom d-flex flex-column"
    style={{
      height: "100%",
      borderRadius: "20px",
      padding: "15px",
    }}
  >
    {/* ================= HEADER ================= */}
    <div
      className="chat-header d-flex align-items-center justify-content-between mb-3"
      style={{ position: "relative" }}
    >
      <div className="d-flex align-items-center">
        <img
          src={otherUser?.profilePic}
          alt="profile"
          style={{
            width: "45px",
            height: "45px",
            borderRadius: "50%",
            objectFit: "cover",
            marginRight: "10px",
            cursor: "pointer",
          }}
          onClick={() => setShowContactInfo(true)}
        />

        <div>
          <h5
            style={{ cursor: "pointer", marginBottom: "2px", color: "white" }}
            onClick={() => setShowContactInfo(true)}
          >
            {otherUser?.name}
          </h5>

          {isTyping ? (
            <small style={{ color: "#ddd", fontStyle: "italic" }}>
              typing...
            </small>
          ) : isOnline ? (
            <small style={{ color: "lightgreen" }}>● Online</small>
          ) : (
            <small style={{ color: "#ccc" }}>
              {lastSeen ? formatLastSeen(lastSeen) : "Offline"}
            </small>
          )}
        </div>
      </div>

      {/* THREE DOT */}
      <div style={{ position: "relative" }}>
        <span
          onClick={() => setShowMenu((prev) => !prev)}
          style={{ fontSize: "22px", cursor: "pointer", padding: "5px" }}
        >
          ⋮
        </span>

        {showMenu && (
          <div
  style={{
    position: "absolute",
    right: 0,
    top: "35px",
    background: "#222",
    borderRadius: "8px",
    padding: "8px 0",
    minWidth: "160px",
    zIndex: 1000,
  }}
>
  <div
    onClick={clearChat}
    style={{
      padding: "8px 12px",
      cursor: "pointer",
      color: "#ff6b6b",
    }}
  >
    Clear Chat
  </div>

  <div
    onClick={deleteChat}
    style={{
      padding: "8px 12px",
      cursor: "pointer",
      color: "#ff3b3b",
      borderTop: "1px solid #444",
    }}
  >
    Delete Chat
  </div>
</div>
        )}
      </div>
    </div>

    {/* ================= CHAT BODY ================= */}
    <div
      className="chat-body flex-grow-1"
      style={{ overflowY: "auto", paddingRight: "10px" }}
    >
      {(() => {
        let lastDate = null;

        return messages.map((m) => {
          const currentDate = getDateLabel(m.createdAt);
          const showDate = currentDate !== lastDate;
          lastDate = currentDate;

          const senderId =
            typeof m.sender === "object" ? m.sender._id : m.sender;

          const isMine = senderId === loggedInUserId;

          return (
            <React.Fragment key={m._id}>
              {/* ✅ DATE DIVIDER ADDED */}
              {showDate && (
                <div className="date-divider">{currentDate}</div>
              )}

              <div
                className={`d-flex mb-3 ${
                  isMine ? "justify-content-end" : "justify-content-start"
                }`}
              >
                <div
                  className={`message-box ${isMine ? "sent" : "received"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMessage(
                      activeMessage === m._id ? null : m._id
                    );
                  }}
                >
                  {/* MENU */}
                  {activeMessage === m._id && !m.deletedForEveryone && (
                    <div className="message-menu">
                      {isMine && (
                        <div
                          className="menu-item delete-everyone"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMessage(m._id, "everyone");
                          }}
                        >
                          Delete for everyone
                        </div>
                      )}

                      <div
                        className="menu-item delete-me"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMessage(m._id, "me");
                        }}
                      >
                        Delete for me
                      </div>
                    </div>
                  )}

                  {/* MESSAGE */}
                  {m.deletedForEveryone ? (
                    <p style={{ fontStyle: "italic", opacity: 0.6 }}>
                      This message was deleted
                    </p>
                  ) : (
                    m.content && (
                      <p style={{ marginBottom: "5px" }}>{m.content}</p>
                    )
                  )}

                  {/* MEDIA */}
                  {m.mediaUrl &&
                    m.mediaType?.startsWith("image") && (
                      <img
                        src={m.mediaUrl}
                        alt="media"
                        style={{
                          maxWidth: "250px",
                          borderRadius: "8px",
                          marginTop: "5px",
                        }}
                      />
                    )}

                  {m.mediaUrl &&
                    m.mediaType?.startsWith("video") && (
                      <video controls width="250">
                        <source src={m.mediaUrl} type={m.mediaType} />
                      </video>
                    )}

                  {m.mediaUrl &&
                    !m.mediaType?.startsWith("image") &&
                    !m.mediaType?.startsWith("video") && (
                      <a
                        href={m.mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "white" }}
                      >
                        📎 {m.mediaName}
                      </a>
                    )}

                  {/* TIME */}
                  <div
                    style={{
                      fontSize: "12px",
                      textAlign: "right",
                      opacity: 0.8,
                    }}
                  >
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}

                    {isMine && m.status === "seen" && (
                      <span
                        style={{ marginLeft: "6px", color: "#4fc3f7" }}
                      >
                        Message seen
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        });
      })()}

      <div ref={chatEndRef} />
    </div>

    {/* ================= INPUT ================= */}
    <div
      className="chat-input d-flex flex-column mt-3"
      style={{ gap: "6px" }}
    >
      {file && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(0,0,0,0.3)",
            padding: "6px 10px",
            borderRadius: "10px",
            width: "fit-content",
            color: "white",
          }}
        >
          📎 {file.name}
          <button
            onClick={() => setFile(null)}
            style={{
              marginLeft: "8px",
              border: "none",
              background: "transparent",
              color: "red",
              cursor: "pointer",
            }}
          >

            ✖
          </button>
        </div>
      )}
      <div style={{ fontSize: "11px", opacity: 0.6 }}>
  {chat.latestMessage?.createdAt &&
    new Date(chat.latestMessage.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}
</div>

      <div className="d-flex align-items-center" style={{ gap: "10px" }}>
        <input
          type="file"
          id="fileUpload"
          style={{ display: "none" }}
          onChange={(e) => setFile(e.target.files[0])}
        />

        <label htmlFor="fileUpload" style={{ cursor: "pointer" }}>
          📎
        </label>

        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);

            sendTypingEvent(chat._id, loggedInUserId, "chat");

            clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
              sendStopTypingEvent(chat._id, loggedInUserId, "chat");
            }, 1500);
          }}
          placeholder="Type a message"
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "20px",
            border: "none",
          }}
        />

        <button onClick={sendMessage}>Send</button>
      </div>
    </div>

    {showContactInfo && (
      <ContactInfo
        user={otherUser}
        messages={messages}
        onClose={() => setShowContactInfo(false)}
      />
    )}
  </div>
);  
};

export default ChatWindow;

