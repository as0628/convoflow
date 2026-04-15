const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

let wss;
let rooms = new Map();

const setupSocket = (server, app) => {
  wss = new WebSocket.Server({ server });

  wss.rooms = rooms;
  app.set("wss", wss);

  wss.on("connection", (ws) => {
    console.log("🟢 Client connected");

    ws.userId = null;
    ws.userName = null; // ✅ ADDED
    ws.currentRoom = null;
    ws.roomType = null;

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);

        /* ================= SETUP (AUTH) ================= */
        if (data.type === "setup") {
          try {
            const decoded = jwt.verify(
              data.token,
              process.env.JWT_SECRET
            );

            ws.userId = decoded.userId || decoded.id;

            // ✅ FETCH USER NAME (ADDED)
            if (ws.userId) {
              const user = await User.findById(ws.userId).select("name");
              ws.userName = user?.name || "Unknown";

              await User.findByIdAndUpdate(ws.userId, {
                isOnline: true,
                lastSeen: null,
              });

              wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(
                    JSON.stringify({
                      type: "user-online",
                      userId: ws.userId,
                    })
                  );
                }
              });
            }
          } catch (err) {
            console.log("❌ Invalid token");
          }
        }

        /* ================= JOIN 1:1 CHAT ================= */
        if (data.type === "join") {
          const roomId = `chat-${data.chatId}`;

          ws.currentRoom = roomId;
          ws.roomType = "chat";

          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
          }

          rooms.get(roomId).add(ws);
          console.log(`📥 Joined chat room ${roomId}`);
        }

        /* ================= JOIN GROUP ================= */
        if (data.type === "join-group") {
          const roomId = `group-${data.groupId}`;

          ws.currentRoom = roomId;
          ws.roomType = "group";

          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
          }

          rooms.get(roomId).add(ws);

          console.log(`👥 Joined group room ${roomId}`);
        }

        /* ================= 1:1 MESSAGE ================= */
        /* ================= 1:1 MESSAGE ================= */
if (data.type === "message") {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "message",
          chatId: data.chatId,
          message: data.message,
        })
      );
    }
  });
}
        /* ================= GROUP MESSAGE ================= */
        if (data.type === "group-message") {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: "group-message",
          groupId: data.groupId,
          message: data.message,
        })
      );
    }
  });
}
        // if (data.type === "group-message") {
        //   const roomId = `group-${data.groupId}`;
        //   const room = rooms.get(roomId);
        //   if (!room) return;

        //   room.forEach((client) => {
        //     if (client.readyState === WebSocket.OPEN) {
        //       client.send(
        //         JSON.stringify({
        //           type: "group-message",
        //           groupId: data.groupId,
        //           message: data.message,
        //         })
        //       );
        //     }
        //   });
        // }

        /* ================= TYPING ================= */
        if (data.type === "typing") {
          const roomId = `chat-${data.chatId}`;
          const room = rooms.get(roomId);
          if (!room) return;

          room.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "typing",
                  userId: ws.userId,
                  userName: ws.userName, // ✅ ADDED
                })
              );
            }
          });
        }

        if (data.type === "stop-typing") {
          const roomId = `chat-${data.chatId}`;
          const room = rooms.get(roomId);
          if (!room) return;

          room.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "stop-typing",
                  userId: ws.userId,
                })
              );
            }
          });
        }

        /* ================= GROUP TYPING ================= */
        if (data.type === "group-typing") {
          const roomId = `group-${data.groupId}`;
          const room = rooms.get(roomId);
          if (!room) return;

          room.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "group-typing",
                  userId: ws.userId,
                  userName: ws.userName, // ✅ IMPORTANT
                })
              );
            }
          });
        }

        if (data.type === "group-stop-typing") {
          const roomId = `group-${data.groupId}`;
          const room = rooms.get(roomId);
          if (!room) return;

          room.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "group-stop-typing",
                  userId: ws.userId,
                })
              );
            }
          });
        }

      /* ================= GROUP SEEN ================= */
if (data.type === "group-seen") {
  const roomId = `group-${data.groupId}`;
  const room = rooms.get(roomId);
  if (!room) return;

  const GroupMessage = require("../models/GroupMessage");

  try {
    // ✅ UPDATE DATABASE (IMPORTANT FIX)
    if (data.messageId) {
      await GroupMessage.findByIdAndUpdate(
        data.messageId,
        {
          $addToSet: { seenBy: ws.userId },
        }
      );
    }

    // ✅ BROADCAST LIVE UPDATE
    room.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "group-seen-update",
            messageId: data.messageId,
            userId: ws.userId,
          })
        );
      }
    });
  } catch (err) {
    console.error("❌ Seen update error:", err);
  }
}
      
      } catch (err) {
        console.error("❌ Socket error:", err);
      }
    });

    ws.on("close", async () => {
      console.log("🔴 Client disconnected");

      if (ws.userId) {
        const lastSeenTime = new Date();

        await User.findByIdAndUpdate(ws.userId, {
          isOnline: false,
          lastSeen: lastSeenTime,
        });

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "user-offline",
                userId: ws.userId,
                lastSeen: lastSeenTime,
              })
            );
          }
        });

        // ✅ AUTO STOP GROUP TYPING ON DISCONNECT
        if (ws.currentRoom && ws.roomType === "group") {
          const room = rooms.get(ws.currentRoom);
          if (room) {
            room.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    type: "group-stop-typing",
                    userId: ws.userId,
                  })
                );
              }
            });
          }
        }
      }

      if (ws.currentRoom && rooms.has(ws.currentRoom)) {
        rooms.get(ws.currentRoom).delete(ws);

        if (rooms.get(ws.currentRoom).size === 0) {
          rooms.delete(ws.currentRoom);
        }
      }
    });
  });
};

module.exports = setupSocket;