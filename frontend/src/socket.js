let socket = null;
let currentRoomId = null;
let currentRoomType = null;
let currentUserId = null;
let reconnectTimeout = null;
let manuallyClosed = false;

/* ================= CONNECT SOCKET ================= */
export const connectSocket = (
  userId,
  roomId,
  roomType,
  onMessage
) => {
  if (!userId || !roomId || !roomType) return;

  if (
    socket &&
    socket.readyState === WebSocket.OPEN &&
    currentRoomId === roomId &&
    currentRoomType === roomType
  ) {
    return;
  }

  if (socket) {
    manuallyClosed = true;
    socket.close();
  }

  manuallyClosed = false;

  currentRoomId = roomId;
  currentRoomType = roomType;
  currentUserId = userId;

  const WS_URL =
  window.location.hostname === "localhost"
    ? "ws://localhost:5000"
    : "wss://convoflow-backend-f47b.onrender.com";

socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log("🟢 Connected");

    socket.send(
      JSON.stringify({
        type: "setup",
        token: localStorage.getItem("token"),
      })
    );

    if (roomType === "group") {
      socket.send(
        JSON.stringify({
          type: "join-group",
          groupId: roomId,
        })
      );
    } else {
      socket.send(
        JSON.stringify({
          type: "join",
          chatId: roomId,
        })
      );
    }
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("📩 SOCKET:", data);

    /* ================= 1:1 MESSAGE ================= */
   if (data.type === "message") {
  const chatId =
    typeof data.message.chat === "string"
      ? data.message.chat
      : data.message.chat?._id;

  // 🔥 ALWAYS UPDATE SIDEBAR
  window.dispatchEvent(
    new CustomEvent("chat-updated", {
      detail: {
        chatId,
        message: data.message,
      },
    })
  );

  // ✅ ONLY update chat window if open
  if (chatId === currentRoomId) {
    onMessage(data.message);
  }
}

    /* ================= DELETE MESSAGE ================= */
    if (data.type === "message-deleted") {
      window.dispatchEvent(
        new CustomEvent("message-deleted", {
          detail: {
            messageId: data.messageId,
            deleteType: data.deleteType,
            userId: data.userId,
          },
        })
      );
    }

    /* ================= GROUP MESSAGE ================= */
    if (data.type === "group-message") {
  const groupId =
    typeof data.message.group === "string"
      ? data.message.group
      : data.message.group?._id;

  // 🔥 ALWAYS UPDATE GROUP SIDEBAR
  window.dispatchEvent(
    new CustomEvent("group-updated", {
      detail: {
        groupId,
        message: data.message,
      },
    })
  );

  // ✅ ONLY update open group chat window
  if (groupId === currentRoomId) {
    onMessage(data.message);
  }
}

    /* ================= GROUP SEEN ================= */
    if (data.type === "group-seen-update") {
      window.dispatchEvent(
        new CustomEvent("group-seen-update", {
          detail: {
            messageId: data.messageId,
            userId: data.userId,
          },
        })
      );
    }

    /* ================= GROUP DELETE ================= */
    if (data.type === "group-message-deleted") {
      window.dispatchEvent(
        new CustomEvent("group-message-deleted", {
          detail: {
            messageId: data.messageId,
            deleteType: data.deleteType,
            userId: data.userId,
          },
        })
      );
    }

    /* ================= TYPING ================= */
    if (
      data.type === "typing" ||
      data.type === "stop-typing"
    ) {
      if (data.userId !== currentUserId) {
        window.dispatchEvent(
          new CustomEvent(data.type, {
            detail: {
              userId: data.userId,
              userName: data.userName || "",
            },
          })
        );
      }
    }

    /* ================= GROUP TYPING ================= */
    if (
      data.type === "group-typing" ||
      data.type === "group-stop-typing"
    ) {
      if (data.userId !== currentUserId) {
        window.dispatchEvent(
          new CustomEvent(data.type, {
            detail: {
              userId: data.userId,
              userName: data.userName || "",
            },
          })
        );
      }
    }
    // yguuuuuuuuuuuu
    /* ================= ONLINE / OFFLINE ================= */
if (data.type === "user-online") {
  window.dispatchEvent(
    new CustomEvent("user-online", {
      detail: data.userId,
    })
  );
}

if (data.type === "user-offline") {
  window.dispatchEvent(
    new CustomEvent("user-offline", {
      detail: {
        userId: data.userId,
        lastSeen: data.lastSeen,
      },
    })
  );
}

    /* ================= STATUS ================= */
    if (data.type === "status-update") {
      window.dispatchEvent(
        new CustomEvent("status-update", {
          detail: {
            messageId: data.messageId,
            status: data.status,
          },
        })
      );
    }
  };

  socket.onclose = () => {
    console.log("🔴 Disconnected");

    if (!manuallyClosed) {
      reconnectTimeout = setTimeout(() => {
        console.log("♻ Reconnecting...");
        connectSocket(
          currentUserId,
          currentRoomId,
          currentRoomType,
          onMessage
        );
      }, 2000);
    }
  };

  socket.onerror = (err) => {
    console.error("❌ Socket Error:", err);
  };
};

/* ================= SEND MESSAGE ================= */
export const sendSocketMessage = (chatId, message) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  socket.send(
    JSON.stringify({
      type: "message",
      chatId,
      message,
    })
  );
};

/* ================= SEND GROUP MESSAGE ================= */
export const sendGroupMessageSocket = (groupId, message) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  socket.send(
    JSON.stringify({
      type: "group-message",
      groupId,
      message,
    })
  );
};

/* ================= SEEN ================= */
export const sendSeenEvent = (
  roomId,
  userId,
  roomType,
  messageId
) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  socket.send(
    JSON.stringify({
      type: roomType === "group" ? "group-seen" : "seen",
      groupId: roomType === "group" ? roomId : undefined,
      chatId: roomType === "chat" ? roomId : undefined,
      userId,
      messageId,
    })
  );
};

/* ================= TYPING ================= */
export const sendTypingEvent = (roomId, userId, roomType) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  socket.send(
    JSON.stringify({
      type: roomType === "group" ? "group-typing" : "typing",
      groupId: roomType === "group" ? roomId : undefined,
      chatId: roomType === "chat" ? roomId : undefined,
      userId,
    })
  );
};

export const sendStopTypingEvent = (
  roomId,
  userId,
  roomType
) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  socket.send(
    JSON.stringify({
      type:
        roomType === "group"
          ? "group-stop-typing"
          : "stop-typing",
      groupId: roomType === "group" ? roomId : undefined,
      chatId: roomType === "chat" ? roomId : undefined,
      userId,
    })
  );
};

/* ================= DISCONNECT ================= */
export const disconnectSocket = () => {
  manuallyClosed = true;

  if (reconnectTimeout) clearTimeout(reconnectTimeout);

  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    socket.close();
  }

  socket = null;
  currentRoomId = null;
  currentRoomType = null;
  currentUserId = null;
};

