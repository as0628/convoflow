import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import GroupInfo from "./GroupInfo";
import {
  connectSocket,
  sendGroupMessageSocket,
  sendTypingEvent,
  sendStopTypingEvent,
  sendSeenEvent,
  disconnectSocket,
} from "../socket";
import { encryptMessage, decryptMessage,} from "../utils/encryption";
import "../css/groupchatwindow.css";

const GroupChatWindow = ({ group }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeMessage, setActiveMessage] = useState(null);

  const typingTimeoutRef = useRef(null);
  const typingUsersTimeoutRef = useRef({});
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const hasConnectedRef = useRef(false);

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
  // tuuuuuuy
  useEffect(() => {
  if (!group?._id || !token) return;

  const markRead = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/groups/read/${group._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      window.dispatchEvent(
        new CustomEvent("group-read", {
          detail: { groupId: group._id },
        })
      );
    } catch (err) {
      console.log(err);
    }
  };

  markRead();
}, [group?._id]);

  /* ================= LOAD MESSAGES + CONNECT SOCKET ================= */
  useEffect(() => {
    if (!group?._id || !token || !loggedInUserId) return;

    const loadMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/groups/messages/${group._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      }
    };

    loadMessages();

    if (!hasConnectedRef.current) {
      connectSocket(
        loggedInUserId,
        group._id,
        "group",
        (msg) => {
  if (!msg?._id) return;

  setMessages((prev) => {
  const exists = prev.find((m) => m._id === msg._id);
  if (exists) return prev;
  return [...prev, msg];
});

// 🔥 UPDATE SIDEBAR
window.dispatchEvent(
  new CustomEvent("group-updated", {
    detail: {
      groupId: group._id,
      message: msg,
    },
  })
);
  // ✅ MARK SEEN PER MESSAGE (FIX)
  if (msg.sender !== loggedInUserId) {
    sendSeenEvent(group._id, loggedInUserId, "group", msg._id);
  }
}
      );

      hasConnectedRef.current = true;
    }

    // sendSeenEvent(group._id, loggedInUserId, "group");

    return () => {
      disconnectSocket();
      hasConnectedRef.current = false;
    };
  }, [group?._id]);
  // delte
  useEffect(() => {
  const handleClickOutside = (e) => {
    if (!e.target.closest(".message-box")) {
      setActiveMessage(null);
    }
  };

  window.addEventListener("click", handleClickOutside);

  return () => {
    window.removeEventListener("click", handleClickOutside);
  };
}, []);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text.trim() && !file) return;

    try {
      const formData = new FormData();
      formData.append("content", encryptMessage(text));
      formData.append("groupId", group._id);
      if (file) formData.append("file", file);

      const res = await axios.post(
        "http://localhost:5000/api/groups/message",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      sendGroupMessageSocket(group._id, res.data);
      sendStopTypingEvent(group._id, loggedInUserId, "group");

      setText("");
      setFile(null);
      setTypingUsers([]);
    } catch (err) {
      console.error(err);
    }
  };
  //clear
  const clearChat = async () => {
  try {
    await axios.put(
      `http://localhost:5000/api/groups/group/clear/${group._id}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setMessages([]); // 🔥 instantly clear UI
    setShowMenu(false);

  } catch (err) {
    console.error(err);
  }
};
  //delete 
  const deleteMessage = async (messageId, deleteType) => {
  try {
    await axios.put(
      "http://localhost:5000/api/groups/group/delete",
      { messageId, deleteType },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  } catch (err) {
    console.error(err);
  }
};

  /* ================= HANDLE TYPING ================= */
  const handleTyping = (e) => {
    setText(e.target.value);

    sendTypingEvent(group._id, loggedInUserId, "group");

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      sendStopTypingEvent(group._id, loggedInUserId, "group");
    }, 1200);
  };
// delete
useEffect(() => {
  const handleDelete = (e) => {
    const { messageId, deleteType, userId } = e.detail;

    setMessages((prev) =>
      prev
        .map((m) => {
          if (m._id !== messageId)
             return m;

          // delete for everyone
          if (deleteType === "everyone") {
            return {
  ...m,
  content: "This message was deleted",
  mediaUrl: "",
  deletedForEveryone: true, // ✅ important
};
          }

          // delete for me
          if (deleteType === "me" && userId === loggedInUserId) {
            return null; // remove message
          }

          return m;
        })
        .filter(Boolean)
    );
  };

  window.addEventListener("group-message-deleted", handleDelete);

  return () => {
    window.removeEventListener("group-message-deleted", handleDelete);
  };
}, [loggedInUserId]);
  /* ================= LISTEN GROUP TYPING ================= */
  useEffect(() => {
    const typingHandler = (e) => {
      const { userId, userName } = e.detail;
      if (!userId || userId === loggedInUserId) return;

      setTypingUsers((prev) => {
        const exists = prev.find((u) => u.userId === userId);
        if (exists) return prev;
        return [...prev, { userId, userName }];
      });

      clearTimeout(typingUsersTimeoutRef.current[userId]);
      typingUsersTimeoutRef.current[userId] = setTimeout(() => {
        setTypingUsers((prev) =>
          prev.filter((u) => u.userId !== userId)
        );
      }, 2000);
    };

    const stopTypingHandler = (e) => {
      const { userId } = e.detail;
      if (!userId) return;

      setTypingUsers((prev) =>
        prev.filter((u) => u.userId !== userId)
      );
    };

    window.addEventListener("group-typing", typingHandler);
    window.addEventListener("group-stop-typing", stopTypingHandler);

    return () => {
      window.removeEventListener("group-typing", typingHandler);
      window.removeEventListener("group-stop-typing", stopTypingHandler);
    };
  }, [loggedInUserId]);

  /* ================= GROUP SEEN LISTENER ================= */
useEffect(() => {
  const handleGroupSeen = (e) => {
    const { messageId, userId } = e.detail;

    setMessages((prev) =>
      prev.map((m) =>
        m._id === messageId
          ? {
              ...m,
              seenBy: [...new Set([...(m.seenBy || []), userId])],
            }
          : m
      )
    );
  };

  window.addEventListener("group-seen-update", handleGroupSeen);

  return () => {
    window.removeEventListener("group-seen-update", handleGroupSeen);
  };
}, []);

  /* ================= TYPING TEXT ================= */
  const typingNames = typingUsers.map((u) => u.userName);

  const typingText =
    typingNames.length === 1
      ? `${typingNames[0]} is typing...`
      : typingNames.length === 2
      ? `${typingNames[0]} and ${typingNames[1]} are typing...`
      : typingNames.length > 2
      ? `${typingNames[0]}, ${typingNames[1]} and ${
          typingNames.length - 2
        } others are typing...`
      : null;
// date
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
  /* ================= UI ================= */
  return (
  <div
    className="group-chat-window d-flex flex-column"
    style={{
      height: "100%",
      color: "white",
    }}
  >
    {/* ===== HEADER ===== */}
    <div
      className="d-flex align-items-center justify-content-between px-3 py-3"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="d-flex align-items-center"
        style={{ cursor: "pointer" }}
        onClick={() => setShowGroupInfo(true)}
      >
        <img
          src={group?.groupPic || "/group-default.png"}
          alt="group"
          style={{
            width: "45px",
            height: "45px",
            borderRadius: "50%",
            objectFit: "cover",
            marginRight: "12px",
          }}
        />

        <div>
          <h5 style={{ marginBottom: "2px" }}>{group?.name}</h5>

          <small style={{ opacity: 0.7 }}>
            {typingText
              ? typingText
              : group?.members
                  ?.map((m) => m.name)
                  .sort((a, b) => a.localeCompare(b))
                  .join(", ")}
          </small>
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <span
          onClick={() => setShowMenu((prev) => !prev)}
          style={{
            fontSize: "20px",
            cursor: "pointer",
            padding: "5px 10px",
          }}
        >
          ⋮
        </span>

        {showMenu && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "30px",
              background: "#2c2c2c",
              borderRadius: "8px",
              padding: "8px 0",
              minWidth: "150px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
              zIndex: 100,
            }}
          >
            <div
              onClick={clearChat}
              style={{
                padding: "8px 15px",
                cursor: "pointer",
                color: "#ff6b6b",
              }}
            >
              Clear Chat
            </div>
          </div>
        )}
      </div>
    </div>

    {/* ===== CHAT BODY ===== */}
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "15px",
      }}
    >
      {(() => {
        let lastDate = null;

        return messages.map((m) => {
          const currentDate = getDateLabel(m.createdAt);
          const showDate = currentDate !== lastDate;
          lastDate = currentDate;

          const senderId =
            typeof m.sender === "object"
              ? m.sender._id
              : m.sender;

          const isMine = senderId === loggedInUserId;
          const senderName =
  isMine
    ? "You"
    : typeof m.sender === "object"
    ? m.sender.name || m.sender.username || "Unknown"
    : "Unknown";

          return (
            <React.Fragment key={m._id}>
              {/* ✅ DATE DIVIDER */}
              {showDate && (
                <div className="date-divider">
                  {currentDate}
                </div>
              )}

              {/* ORIGINAL MESSAGE */}
              <div
  className={`d-flex flex-column mb-3 ${
    isMine
      ? "align-items-end"
      : "align-items-start"
  }`}
>
  <small
    style={{
      marginBottom: "4px",
      opacity: 0.8,
      fontSize: "12px",
      fontWeight: "600",
      paddingLeft: isMine ? "0" : "4px",
      paddingRight: isMine ? "4px" : "0",
    }}
  >
    {senderName}
  </small>
                <div
                  className={`message-box ${
                    isMine ? "sent" : "received"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMessage(
                      activeMessage === m._id ? null : m._id
                    );
                  }}
                >
                  {/* MENU */}
                  {activeMessage === m._id &&
                    !m.deletedForEveryone && (
                      <div className="message-menu">
                        {isMine && (
                          <div
                            className="menu-item delete-everyone"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(
                                m._id,
                                "everyone"
                              );
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
                    <p
                      style={{
                        fontStyle: "italic",
                        opacity: 0.6,
                      }}
                    >
                      This message was deleted
                    </p>
                  ) : (
                    m.content && (
                      <p style={{ marginBottom: "5px" }}>
                       {decryptMessage(m.content)}
                      </p>
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
                        }}
                      />
                    )}

                  {m.mediaUrl &&
                    m.mediaType?.startsWith("video") && (
                      <video controls width="250">
                        <source
                          src={m.mediaUrl}
                          type={m.mediaType}
                        />
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

                  {/* TIME + SEEN */}
                  <div
                    style={{
                      fontSize: "12px",
                      textAlign: "right",
                      opacity: 0.7,
                      marginTop: "4px",
                    }}
                  >
                    {new Date(
                      m.createdAt
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}

                    {isMine &&
                      m.seenBy &&
                      m.seenBy.length > 0 && (
                        <div
                          style={{
                            fontSize: "11px",
                            marginTop: "2px",
                            color: "#4fc3f7",
                          }}
                        >
                          {(() => {
                            const seenUsers =
                              group.members.filter(
                                (u) =>
                                  u._id.toString() !==
                                    loggedInUserId &&
                                  m.seenBy?.some(
                                    (id) =>
                                      id.toString() ===
                                      u._id.toString()
                                  )
                              );

                            const names =
                              seenUsers.map(
                                (u) => u.name
                              );

                            if (
                              names.length >=
                              group.members.length - 1
                            ) {
                              return "Seen by all";
                            }

                            if (names.length === 1) {
                              return `Seen by ${names[0]}`;
                            }

                            if (names.length === 2) {
                              return `Seen by ${names[0]}, ${names[1]}`;
                            }

                            if (names.length > 2) {
                              return `Seen by ${names[0]}, ${names[1]} +${
                                names.length - 2
                              }`;
                            }

                            return null;
                          })()}
                        </div>
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

    {/* ===== INPUT ===== */}
    <div
      className="d-flex align-items-center p-3"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.08)",
        gap: "10px",
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button
        onClick={() => fileInputRef.current.click()}
        style={{
          border: "none",
          background: "transparent",
          fontSize: "20px",
        }}
      >
        📎
      </button>

      <input
        value={text}
        onChange={handleTyping}
        placeholder="Type a message"
        style={{
          flex: 1,
          padding: "8px 15px",
          borderRadius: "20px",
          border: "none",
        }}
      />

      <button
        onClick={sendMessage}
        style={{
          border: "none",
          borderRadius: "20px",
          padding: "6px 15px",
          background: "white",
        }}
      >
        Send
      </button>
    </div>

    {/* FILE PREVIEW */}
    {file && (
      <div style={{ padding: "8px 15px", fontSize: "14px" }}>
        📎 {file.name}
        <span
          onClick={() => setFile(null)}
          style={{ cursor: "pointer", marginLeft: "10px" }}
        >
          ❌
        </span>
      </div>
    )}

    {showGroupInfo && (
      <GroupInfo
        group={group}
        messages={messages}
        onClose={() => setShowGroupInfo(false)}
      />
    )}
  </div>
);
};

export default GroupChatWindow;